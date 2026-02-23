import solc from 'solc';
import axios from 'axios';

async function resolveImports(sources) {
  const allSources = { ...sources };
  const queue = Object.keys(sources).map(k => ({ key: k, content: sources[k].content }));
  const processed = new Set(Object.keys(sources));

  const resolveUrl = (path) => {
    if (path.startsWith("@openzeppelin/")) return `https://unpkg.com/${path}`;
    if (path.startsWith("http")) return path;
    return `https://unpkg.com/${path}`;
  };

  const resolvePath = (base, relative) => {
    if (relative.startsWith("@") || relative.startsWith("http")) return relative;
    if (!relative.startsWith(".")) return relative;

    const stack = base.split("/");
    stack.pop(); // remove filename

    const parts = relative.split("/");
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
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
          if (processed.has(resolvedKey)) continue;

          const url = resolveUrl(resolvedKey);
          const res = await axios.get(url);
          const importedContent = res.data;

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

export async function compileSolidity(sources) {
  const finalSources = await resolveImports(sources);
  
  const input = {
    language: "Solidity",
    sources: finalSources,
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"]
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      throw new Error(errors.map(e => e.formattedMessage).join('\n'));
    }
  }

  const artifacts = [];
  for (const file in output.contracts) {
    for (const contract in output.contracts[file]) {
      artifacts.push({
        name: contract,
        abi: output.contracts[file][contract].abi,
        bytecode: output.contracts[file][contract].evm.bytecode.object,
        fileName: file
      });
    }
  }

  return artifacts;
}
