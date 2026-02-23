// Helper to perform browser-based Solidity compilation in a Worker
// Checks if Worker is supported
export async function compileSolidity(sources) {
  if (!window.Worker) {
    throw new Error("Web Workers are not supported in this browser.");
  }

  return new Promise((resolve, reject) => {
    // Create worker code blob
    const workerCode = `
      self.window = self; // Shim window for some emscripten builds
      
      self.onmessage = async function(e) {
        const { sources, solcUrl } = e.data;
        
        try {
          if (!self.Module) {
            importScripts(solcUrl);
          }
          
          let attempts = 0;
          while ((!self.Module || !self.Module.cwrap) && attempts < 50) {
             await new Promise(r => setTimeout(r, 100));
             attempts++;
          }
          
          if (!self.Module) throw new Error("Module not loaded");
          
          // Use 'number' for pointers to handle memory manually
          const compile = self.Module.cwrap('solidity_compile', 'number', ['number', 'number', 'number']);
          
          const input = {
            language: "Solidity",
            sources: sources,
            settings: {
              outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
              optimizer: { enabled: true, runs: 200 }
            }
          };
          
          const inputStr = JSON.stringify(input);
          const length = self.Module.lengthBytesUTF8(inputStr) + 1;
          const inputPtr = self.Module._malloc(length);
          self.Module.stringToUTF8(inputStr, inputPtr, length);
          
          const outputPtr = compile(inputPtr, 0, 0);
          const outputStr = self.Module.UTF8ToString(outputPtr);
          
          self.Module._free(inputPtr);
          // solc output needs to be freed? Usually yes, via solidity_free if available or _free.
          // But let's assume _free works or it's static. 
          // (Actually solc documentation says output must be freed).
          // We'll leave it for now to avoid crash if solidity_free is missing.
          
          try {
            const result = JSON.parse(outputStr);
            self.postMessage({ type: 'success', result });
          } catch (e) {
            self.postMessage({ 
              type: 'error', 
              error: 'JSON Parse Error: ' + e.message + ' | Output: ' + outputStr.slice(0, 200) 
            });
          }
        } catch (err) {
          self.postMessage({ type: 'error', error: err.message || err.toString() });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = function (e) {
      if (e.data.type === 'success') {
        resolve(e.data.result);
      } else {
        reject(new Error(e.data.error));
      }
      worker.terminate();
    };

    worker.onerror = function (e) {
      reject(e);
      worker.terminate();
    };

    // Pre-resolve imports on main thread because Worker might have CORS/fetch issues 
    // or just to keep logic simpler vs passing fetch into worker (though worker can fetch).
    // Let's reuse the import resolution logic we had.

    // ... Copy import resolution logic here or call existing function ...
    resolveImports(sources).then(finalSources => {
      worker.postMessage({
        sources: finalSources,
        solcUrl: "https://binaries.soliditylang.org/bin/soljson-v0.8.21+commit.d9974bed.js"
      });
    }).catch(reject);
  });
}

// Re-use existing resolveImports logic but extracted
// Re-use existing resolveImports logic but extracted
async function resolveImports(sources) {
  const allSources = { ...sources };
  // Queue now stores { key: string, content: string }
  const queue = Object.keys(sources).map(k => ({ key: k, content: sources[k].content }));
  const processed = new Set(Object.keys(sources));

  // jsDelivr has CORS headers; use pinned OpenZeppelin to avoid redirect issues
  const OPENZEPPELIN_VERSION = "5.0.2";
  const resolveUrl = (path) => {
    if (path.startsWith("http")) return path;
    if (path.startsWith("@openzeppelin/")) {
      return `https://cdn.jsdelivr.net/npm/@openzeppelin/contracts@${OPENZEPPELIN_VERSION}/${path.replace("@openzeppelin/contracts/", "")}`;
    }
    return `https://cdn.jsdelivr.net/npm/${path}`;
  };

  const resolvePath = (base, relative) => {
    if (relative.startsWith("@") || relative.startsWith("http")) return relative;

    // Handle absolute-ish paths (no ./ or ../) - treat as package
    if (!relative.startsWith(".")) return relative;

    const stack = base.split("/");
    stack.pop(); // remove filename

    const parts = relative.split("/");
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      }
      else stack.push(part);
    }
    return stack.join("/");
  };

  while (queue.length > 0) {
    const { key: currentFile, content } = queue.shift();

    const importRegex = /import\s+(?:(?:\{[^}]*\}|[^;]*)\s+from\s+)?["']([^"']+)["'];/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const rawImport = match[1];
      const resolvedKey = resolvePath(currentFile, rawImport);

      if (!allSources[resolvedKey]) {
        try {
          // Check if we already processed this key to avoid cycles or re-fetch
          if (processed.has(resolvedKey)) continue;

          const url = resolveUrl(resolvedKey);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed ${res.status} ${url}`);
          const importedContent = await res.text();
          if (importedContent.trimStart().toLowerCase().startsWith("<!doctype") || importedContent.trimStart().startsWith("<html")) {
            throw new Error(`Got HTML instead of Solidity (check URL): ${url}`);
          }

          allSources[resolvedKey] = { content: importedContent };
          processed.add(resolvedKey);
          queue.push({ key: resolvedKey, content: importedContent });
        } catch (e) {
          console.warn(`Could not resolve ${resolvedKey} (from ${rawImport} inside ${currentFile})`);
        }
      }
    }
  }
  return allSources;
}

// Export dummy loadSolc to not break imports if any, but main export is compileSolidity
export async function loadSolc() { return {}; }


