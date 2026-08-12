import { ListingModal } from "@/components/ListingModal";
import ListingDetail from "../../[id]/page";

/**
 * Intercepting route: when a listing card is clicked from /listings, render the
 * full property page inside a modal overlay instead of navigating away. A direct
 * visit or refresh of /listings/[id] renders the full page normally.
 */
export default async function InterceptedListing(props: { params: Promise<{ id: string }> }) {
  return (
    <ListingModal>
      {await ListingDetail(props)}
    </ListingModal>
  );
}
