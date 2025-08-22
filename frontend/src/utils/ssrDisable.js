// Utility to disable SSR for React Router pages
export function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}

// Alternative for static generation disable
export function getStaticProps() {
  return {
    props: {},
    // Revalidate every second to essentially disable static generation
    revalidate: 1,
  };
}