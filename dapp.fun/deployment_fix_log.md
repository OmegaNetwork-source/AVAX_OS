# Issue Resolved: Chain ID Mismatch

We encountered an error where MetaMask rejected the transaction because of a Chain ID mismatch.
- Expected by App: `1313161768` (0x4e454128)
- Returned by Network: `1313161512` (0x4e454028)

**Fix Applied:**
Updated `dappforge.jsx` to use the correct Chain ID `1313161512` (0x4e454028) for the Omega Network connection logic.

Please **reload** the page and try connecting/deploying again. MetaMask should now recognize the network correctly.
