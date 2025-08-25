import {
    ScoringConfigCreate,
    ScoringConfigUpdate,
    ScoringConfigWithDetails,
    ScoringPreview,
} from "types/scoring"
import { ScoringConfigPool } from "persistence/db/pool/scoring-configs"
import { ITrueFitEventRelaying, TrueFitEventTypes } from "services/events"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export interface IScoringConfigService {
    /**
     * Get a scoring config by ID
     * @param {string} id - The ID of the config to get
     * @returns {Promise<ScoringConfigWithDetails | null>} - The config with details
     */
    getScoringConfigById(id: string): Promise<ScoringConfigWithDetails | null>

    /**
     * Get all scoring configs with optional filters
     * @param {boolean} isDefault - Filter by default status
     * @param {string} jobId - Filter by job ID
     * @returns {Promise<ScoringConfigWithDetails[]>} - The configs with details
     */
    getScoringConfigs(
        isDefault?: boolean,
        jobId?: string,
    ): Promise<ScoringConfigWithDetails[]>

    /**
     * Create a scoring config
     * @param {ScoringConfigCreate} config - The config to create
     * @returns {Promise<ScoringConfigWithDetails>} - The created config
     */
    createScoringConfig(
        config: ScoringConfigCreate,
    ): Promise<ScoringConfigWithDetails>

    /**
     * Update a scoring config
     * @param {string} id - The ID of the config to update
     * @param {ScoringConfigUpdate} config - The config data to update
     * @returns {Promise<ScoringConfigWithDetails>} - The updated config
     */
    updateScoringConfig(
        id: string,
        config: ScoringConfigUpdate,
    ): Promise<ScoringConfigWithDetails>

    /**
     * Delete a scoring config
     * @param {string} id - The ID of the config to delete
     * @returns {Promise<void>}
     */
    deleteScoringConfig(id: string): Promise<void>

    /**
     * Apply scoring config to a job
     * @param {string} configId - The ID of the config to apply
     * @param {string} jobId - The ID of the job to apply to
     * @returns {Promise<ScoringConfigWithDetails>} - The applied config
     */
    applyScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringConfigWithDetails>

    /**
     * Preview impact of applying a scoring config
     * @param {string} configId - The ID of the config to preview
     * @param {string} jobId - The ID of the job to preview for
     * @returns {Promise<ScoringPreview>} - The preview results
     */
    previewScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringPreview>
}

class ScoringConfigService implements IScoringConfigService {
    constructor(
        private readonly pool: ScoringConfigPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getScoringConfigById(
        id: string,
    ): Promise<ScoringConfigWithDetails | null> {
        return this.pool.getScoringConfigById(id)
    }

    async getScoringConfigs(
        isDefault?: boolean,
        jobId?: string,
    ): Promise<ScoringConfigWithDetails[]> {
        return this.pool.getScoringConfigs(isDefault, jobId)
    }

    async createScoringConfig(
        config: ScoringConfigCreate,
    ): Promise<ScoringConfigWithDetails> {
        // Validate negative marking fraction
        if (
            config.negativeMarkingFraction < 0 ||
            config.negativeMarkingFraction > 1
        ) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Negative marking fraction must be between 0 and 1",
            )
        }

        // Validate recency boost
        const recencyBoost = config.recencyBoostPercent
        if (recencyBoost !== undefined && recencyBoost !== null) {
            if (recencyBoost < 0 || recencyBoost > 100) {
                throw new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "Recency boost percentage must be between 0 and 100",
                )
            }

            if (!config.recencyWindowDays) {
                throw new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "Recency window days is required when recency boost is enabled",
                )
            }

            if (config.recencyWindowDays <= 0) {
                throw new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "Recency window days must be positive",
                )
            }
        }

        const createdConfig = await this.pool.createScoringConfig(config)

        // Emit scoring config changed event for ranking recalculation
        await this.events.dispatchEvent({
            type: TrueFitEventTypes.SCORING_CONFIG_CHANGED,
            payload: {
                configId: createdConfig.id,
                isDefault: createdConfig.isDefault,
                jobId: createdConfig.jobId,
                action: "created",
            },
        })

        return createdConfig
    }

    async updateScoringConfig(
        id: string,
        config: ScoringConfigUpdate,
    ): Promise<ScoringConfigWithDetails> {
        // Validate negative marking fraction
        if (
            config.negativeMarkingFraction !== undefined &&
            (config.negativeMarkingFraction < 0 ||
                config.negativeMarkingFraction > 1)
        ) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Negative marking fraction must be between 0 and 1",
            )
        }

        // Validate recency boost
        const recencyBoost = config.recencyBoostPercent
        if (recencyBoost !== undefined && recencyBoost !== null) {
            if (recencyBoost < 0 || recencyBoost > 100) {
                throw new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "Recency boost percentage must be between 0 and 100",
                )
            }

            if (!config.recencyWindowDays) {
                throw new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "Recency window days is required when recency boost is enabled",
                )
            }

            if (config.recencyWindowDays <= 0) {
                throw new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "Recency window days must be positive",
                )
            }
        }

        const updatedConfig = await this.pool.updateScoringConfig(id, config)

        // Emit scoring config changed event for ranking recalculation
        await this.events.dispatchEvent({
            type: TrueFitEventTypes.SCORING_CONFIG_CHANGED,
            payload: {
                configId: id,
                isDefault: updatedConfig.isDefault,
                jobId: updatedConfig.jobId,
                action: "updated",
                changes: config,
            },
        })

        return updatedConfig
    }

    async deleteScoringConfig(id: string): Promise<void> {
        const config = await this.pool.getScoringConfigById(id)
        if (!config) {
            throw new ServiceError(
                ServiceErrorType.NotFound,
                "Scoring config not found",
            )
        }

        if (config.isDefault) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Cannot delete default scoring config",
            )
        }

        await this.pool.deleteScoringConfig(id)

        // await this.events.dispatchEvent({
        //     type: "SCORING_CONFIG_DELETED",
        //     payload: {
        //         configId: id,
        //         jobId: config.jobId,
        //     }
        // })
    }

    async applyScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringConfigWithDetails> {
        const config = await this.pool.getScoringConfigById(configId)
        if (!config) {
            throw new ServiceError(
                ServiceErrorType.NotFound,
                "Scoring config not found",
            )
        }

        const appliedConfig = await this.pool.applyScoringConfig(
            configId,
            jobId,
        )

        // await this.events.dispatchEvent({
        //     type: "SCORING_CONFIG_APPLIED",
        //     payload: {
        //         configId,
        //         jobId,
        //     }
        // })

        return appliedConfig
    }

    async previewScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringPreview> {
        const config = await this.pool.getScoringConfigById(configId)
        if (!config) {
            throw new ServiceError(
                ServiceErrorType.NotFound,
                "Scoring config not found",
            )
        }

        return this.pool.previewScoringConfig(configId, jobId)
    }
}

export default function getScoringConfigService(
    pool: ScoringConfigPool,
    events: ITrueFitEventRelaying,
): IScoringConfigService {
    return new ScoringConfigService(pool, events)
}
