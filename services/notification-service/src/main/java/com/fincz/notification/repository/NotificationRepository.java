package com.fincz.notification.repository;

import com.fincz.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Repository for Notification entity operations.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserEmail(String userEmail);

    List<Notification> findByUserEmailAndType(String userEmail, String type);

    @Query("SELECT n FROM Notification n WHERE n.sentAt >= :since")
    List<Notification> findRecentNotifications(@Param("since") LocalDateTime since);

    boolean existsByUserEmailAndTypeAndSentAtAfter(String userEmail, String type, LocalDateTime since);
}