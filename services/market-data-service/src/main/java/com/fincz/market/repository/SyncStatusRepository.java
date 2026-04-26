package com.fincz.market.repository;

import com.fincz.market.entity.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for accessing global sync state.
 */
@Repository
public interface SyncStatusRepository extends JpaRepository<SyncStatus, String> {
}