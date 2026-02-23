import axios from 'axios';

async function testDeployment() {
    const payload = {
        "chainId": "omega-mainnet",
        "privateKey": "11dfd35d6ca6a92375f1740192977ca8ecb96c9789fd85ddeaf6a59cc091a8bc",
        "contractName": "TestToken",
        "sources": {
            "TestToken.sol": {
                "content": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ninterface IERC20 {\n    function totalSupply() external view returns (uint256);\n    function balanceOf(address account) external view returns (uint256);\n    function transfer(address to, uint256 amount) external returns (bool);\n    function allowance(address owner, address spender) external view returns (uint256);\n    function approve(address spender, uint256 amount) external returns (bool);\n    function transferFrom(address from, address to, uint256 amount) external returns (bool);\n    event Transfer(address indexed from, address indexed to, uint256 value);\n    event Approval(address indexed owner, address indexed spender, uint256 value);\n}\n\ncontract TestToken is IERC20 {\n    string public name = \"Test Token\";\n    string public symbol = \"TEST\";\n    uint8 public decimals = 18;\n    uint256 private _totalSupply = 1000 * 10**18;\n    mapping(address => uint256) private _balanceOf;\n    mapping(address => mapping(address => uint256)) private _allowance;\n\n    constructor() {\n        _balanceOf[msg.sender] = _totalSupply;\n        emit Transfer(address(0), msg.sender, _totalSupply);\n    }\n\n    function totalSupply() external view override returns (uint256) {\n        return _totalSupply;\n    }\n\n    function balanceOf(address account) external view override returns (uint256) {\n        return _balanceOf[account];\n    }\n\n    function transfer(address to, uint256 amount) external override returns (bool) {\n        require(_balanceOf[msg.sender] >= amount, \"Insufficient balance\");\n        _balanceOf[msg.sender] -= amount;\n        _balanceOf[to] += amount;\n        emit Transfer(msg.sender, to, amount);\n        return true;\n    }\n\n    function allowance(address owner, address spender) external view override returns (uint256) {\n        return _allowance[owner][spender];\n    }\n\n    function approve(address spender, uint256 amount) external override returns (bool) {\n        _allowance[msg.sender][spender] = amount;\n        emit Approval(msg.sender, spender, amount);\n        return true;\n    }\n\n    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {\n        require(_balanceOf[from] >= amount, \"Insufficient balance\");\n        require(_allowance[from][msg.sender] >= amount, \"Insufficient allowance\");\n        _balanceOf[from] -= amount;\n        _balanceOf[to] += amount;\n        _allowance[from][msg.sender] -= amount;\n        emit Transfer(from, to, amount);\n        return true;\n    }\n}"
            }
        }
    };

    try {
        console.log("Sending deployment request...");
        const response = await axios.post('http://localhost:3001/deploy', payload);
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error("Error Response Status:", error.response.status);
            console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testDeployment();
