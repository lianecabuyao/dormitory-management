package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Enums.UserRole;
import com.dormisync.dormitory_management.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    public User createUser(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {

        User user = getUserById(id);

        user.setFirstName(updatedUser.getFirstName());
        user.setLastName(updatedUser.getLastName());
        user.setEmail(updatedUser.getEmail());
        user.setPassword(updatedUser.getPassword());
        user.setContactNumber(updatedUser.getContactNumber());
        user.setRole(updatedUser.getRole());

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {

        User user = getUserById(id);

        userRepository.delete(user);
    }

    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }
}
