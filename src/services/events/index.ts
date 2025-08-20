/**
 * Different types of events that may occur in the system.
 */
export enum TrueFitEventTypes {
    APPLICANT_REGISTERED = "APPLICANT_REGISTERED",
    ASSESSMENT_SUBMITTED = "ASSESSMENT_SUBMITTED",
    ASSESSMENT_SCORED = "ASSESSMENT_SCORED",
    JOB_CREATED = "JOB_CREATED",
    JOB_UPDATED = "JOB_UPDATED",
    JOB_DEACTIVATED = "JOB_DEACTIVATED",
    APPLICANT_MATCHED = "APPLICANT_MATCHED",
    MATCH_RESULTS_GENERATED = "MATCH_RESULTS_GENERATED",
    COMPANY_REGISTERED = "COMPANY_REGISTERED",
    BRANCH_CREATED = "BRANCH_CREATED",
}

export type TrueFitEvent = {
    type: TrueFitEventTypes
    payload: any
}
/**
 * An event listener can be used to listen for dispatched events
 */
export type TrueFitEventListener = (event: TrueFitEvent) => Promise<void>
/**
 * Interface for relaying events
 */
export interface ITrueFitEventRelaying {
    /**
     * Dispatch a new V-Plus event
     * @param {TrueFitEvent} event
     */
    dispatchEvent(event: TrueFitEvent): Promise<void>
    /**
     * Listen for events of specified types
     * @param {TrueFitEventTypes[]} eventTypes - Types of events that should be listened for
     * @param {TrueFitEventListener} listener - Callback function that will be called when an event is dispatched
     */
    listenForEvents(
        eventTypes: TrueFitEventTypes[],
        listener: TrueFitEventListener,
    ): void
}
