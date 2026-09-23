// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title ForgeToken
/// @author Ivan Portnov
/// @notice ERC-20 compatible token implemented from scratch for educational
///         and portfolio purposes.
/// @dev Includes capped supply, ownership, pausability, minting,
///      burning, delegated burning, and infinite allowance support.
contract ForgeToken is IERC20Metadata {

    error ZeroAddress();
    error NotOwner(address caller);
    error InsufficientBalance(uint256 requested, uint256 available);
    error InsufficientAllowance(uint256 requested, uint256 available);
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error ContractPaused();
    error ContractNotPaused();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    address public owner;
    string public override name;
    string public override symbol;
    uint8 public constant override decimals = 18;
    uint256 public override totalSupply;
    uint256 public immutable maxSupply;
    bool public paused;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner(msg.sender);
        }
        _;
    }

    modifier whenNotPaused() {
        if (paused) {
            revert ContractPaused();
        }
        _;
    }

    modifier whenPaused() {
        if (!paused) {
            revert ContractNotPaused();
        }
        _;
    }

    /// @notice Creates a new ForgeToken instance.
    /// @dev Initial supply and max supply are provided in whole-token units
    ///      and converted internally using 18 decimals.
    /// @param _name Token name.
    /// @param _symbol Token symbol.
    /// @param _initialSupply Initial supply in whole tokens.
    /// @param _maxSupply Maximum supply in whole tokens.
    constructor (
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _maxSupply
    ) {
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        uint256 initialSupply = _initialSupply * (10 ** uint256(decimals));
        maxSupply = _maxSupply * (10 ** uint256(decimals));
        _mint(msg.sender, initialSupply);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function balanceOf(
        address user
    ) external view override returns (uint256) {
        return balances[user];
    }

    function allowance(
        address tokenOwner,
        address spender
    ) external view override returns(uint256) {
        return allowances[tokenOwner][spender];
    }

    function transfer(
        address to,
        uint256 amount
    ) external override whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        if (from == address(0)) {
            revert ZeroAddress();
        }
        _update(from, to, amount);
    }

    function approve(
        address spender,
        uint256 amount
    ) external override returns(bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function _approve(
        address tokenOwner,
        address spender,
        uint256 amount
    ) internal{
        if (spender == address(0)) {
            revert ZeroAddress();
        }
        if (tokenOwner == address(0)) {
            revert ZeroAddress();
        }
        allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override whenNotPaused returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /// @notice Mints new tokens to an address.
    /// @dev Only the owner can mint. Total supply cannot exceed maxSupply.
    /// @param to Recipient of newly minted tokens.
    /// @param amount Amount in base units.
    /// @return True on success.
    function mint(
        address to,
        uint256 amount
    ) external onlyOwner whenNotPaused returns (bool) {
        _mint(to, amount);
        return true;
    }

    function _mint(
        address to,
        uint256 amount
    ) internal {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        uint256 availableMint = maxSupply - totalSupply;
        if (amount > availableMint) {
            revert MaxSupplyExceeded(amount, availableMint);
        }
        _update(address(0), to, amount);
    }

    /// @notice Burns tokens from the caller's balance.
    /// @param amount Amount in base units.
    /// @return True on success.
    function burn(
        uint256 amount
    ) external whenNotPaused returns(bool) {
         _burn(msg.sender, amount);
         return true;
    }

    function _burn(
        address from,
        uint256 amount
    ) internal {
        if (from == address(0)) {
            revert ZeroAddress();
        }
        _update(from, address(0), amount);
    }

    /// @notice Transfers contract ownership to a new account.
    /// @param newOwner Address of the new owner.
    function transferOwnership(
        address newOwner
    ) external onlyOwner {
        if (newOwner == address(0)) {
            revert ZeroAddress();
        }
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /// @notice Pauses token transfers, minting, and burning.
    /// @dev Approval-related functions remain available while paused.
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Resumes token transfers, minting, and burning.
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Burns tokens from another account using allowance.
    /// @dev Uses the same allowance semantics as transferFrom.
    /// @param from Account whose tokens will be burned.
    /// @param amount Amount in base units.
    /// @return True on success.
    function burnFrom(
        address from,
        uint256 amount
    ) external whenNotPaused returns(bool) {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        return true;
    }

    function _spendAllowance(
        address tokenOwner,
        address spender,
        uint256 amount
    ) internal {
        if (tokenOwner == address(0)) {
            revert ZeroAddress();
        }
        uint256 currentAllowance = allowances[tokenOwner][spender];
        if (currentAllowance < amount) {
            revert InsufficientAllowance(amount, currentAllowance);
        }
        if (currentAllowance != type(uint256).max) {
            allowances[tokenOwner][spender] = currentAllowance - amount;
        }   
    }

    /// @notice Increases allowance granted to a spender.
    /// @param spender Address allowed to spend tokens.
    /// @param addedAmount Amount added to the current allowance.
    /// @return True on success.
    function increaseAllowance(
        address spender,
        uint256 addedAmount
    ) external returns(bool) {
        uint256 currentAllowance = allowances[msg.sender][spender];
        _approve(msg.sender, spender, currentAllowance + addedAmount);
        return true;
    }

    /// @notice Decreases allowance granted to a spender.
    /// @param spender Address whose allowance is reduced.
    /// @param subtractedAmount Amount subtracted from the current allowance.
    /// @return True on success.
    function decreaseAllowance(
        address spender,
        uint256 subtractedAmount
    ) external returns(bool) {
        uint256 currentAllowance = allowances[msg.sender][spender];
        if (currentAllowance < subtractedAmount) {
            revert InsufficientAllowance(subtractedAmount, currentAllowance);
        }
        _approve(msg.sender, spender, currentAllowance - subtractedAmount);
        return true;
    }

    /// @dev Centralized token state transition function.
    ///      from == address(0) represents minting.
    ///      to == address(0) represents burning.
    ///      Non-zero from/to represents a transfer.

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal {
        if (from == address(0) && to == address(0)) {
            revert ZeroAddress();
        }
        if (from == address(0)) {
            totalSupply += amount;
        } else {
            uint256 fromBalance = balances[from];
            if(fromBalance < amount) {revert InsufficientBalance(amount, fromBalance);}
            balances[from] = fromBalance - amount;
        }
        if (to == address(0)) {
            totalSupply -= amount;
        } else {
            balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

}


