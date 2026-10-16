import UserRole from "../constants/UserRole.js";

class User {
    id;
    username;
    passwordHash;
    role;

    constructor(id, username, passwordHash, role) {
        if(!Object.values(UserRole).includes(role)) {
            throw new Error("Invalid user role");
        }

        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    hasRole(role) {
        return this.role === role;
    }

    isAdmin() {
        return this.role === UserRole.ADMIN;
    }

    isManager() {
        return this.role === UserRole.MANAGER;
    }

    isOfficer() {
        return this.role === UserRole.OFFICER;
    }

    toString() {
        return `User ${this.username} | Role: ${this.role}`;
    }
}

export default User;