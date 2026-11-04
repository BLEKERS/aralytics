package ph.aralytics.backend.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Accepts either the account email or the issued username/student ID.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCaseOrUsername(identifier, identifier)
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        return new UserPrincipal(user);
    }
}
