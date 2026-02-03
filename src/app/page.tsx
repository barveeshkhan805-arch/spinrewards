import MainPage from './(main)/page';

/**
 * This file re-exports the page from the (main) route group.
 * This pattern is used to include a page in the root of the app
 * while still keeping it within a route group for layout purposes.
 * It resolves build conflicts that can arise from having multiple
 * pages at the same route.
 */
export default MainPage;
