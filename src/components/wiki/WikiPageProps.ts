/**
 * A reference page shows its list when `recordId` is missing and the page of one record when it is
 * set. `recordId` is the package id from the address, already decoded.
 */
export interface WikiPageProps {
  recordId?: string;
}
