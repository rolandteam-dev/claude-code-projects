/**
 * Layout for the listings section. The `modal` parallel-route slot renders the
 * intercepting-route modal (see @modal/(.)[id]) so a listing opens as an
 * overlay over the search results; it's null on the base /listings route.
 */
export default function ListingsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
