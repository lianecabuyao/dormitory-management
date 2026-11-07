package com.dormisync.dormitory_management.DTO;

public class LoginRequest {

    /** Which login page the request came from. */
    public enum Portal {
        TENANT,
        STAFF
    }

    private String email;
    private String password;
    private Portal portal;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Portal getPortal() {
        return portal;
    }

    public void setPortal(Portal portal) {
        this.portal = portal;
    }
}
