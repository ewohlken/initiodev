<?php
/**
 * Functions in this file return various versions of page titles
 * @subpackage GC15_Platform
 * @author Adrian Ortega <aortega@goldencomm.com>
 */


/**
 * Returns the title for the archive currently being displayed depending on type
 * @author Adrian Ortega
 *
 * @param string $before_title
 * @param string $after_title
 * @param bool $no_html
 * @return string|void
 */
function gc15_get_archive_title($before_title = "", $after_title = "", $no_html = false)
{
    $page_title = '';
    if ($no_html) {
        if (is_category()) {
            $page_title = sprintf(__('Archive for the %s Category', THEME_DOMAIN), single_cat_title("", false));
        } elseif (is_tag()) {
            $page_title = sprintf(__('Posts Tagged %s', THEME_DOMAIN), single_tag_title('', false));
        } elseif (is_day()) {
            $page_title = sprintf(__('Archive for %s', THEME_DOMAIN), get_the_time('F jS, Y'));
        } elseif (is_month()) {
            $page_title = sprintf(__('Archive for %s', THEME_DOMAIN), get_the_time('F, Y'));
        } elseif (is_year()) {
            $page_title = sprintf(__('Archive for %s', THEME_DOMAIN), get_the_time('Y'));
        } elseif (is_author()) {
            $page_title = __('Author Archive', THEME_DOMAIN);
        } elseif (isset($_GET['paged']) && !empty($_GET['paged'])) {
            $page_title = __('Blog Archive', THEME_DOMAIN);
        }
    } else {
        if (is_category()) {
            $page_title = sprintf(__('Archive for the %s Category', THEME_DOMAIN), '<span class="archive-term">' . single_cat_title("", false) . '</span>');
        } elseif (is_tag()) {
            $page_title = sprintf(__('Posts Tagged %s', THEME_DOMAIN), '<span class="archive-term">' . single_tag_title('', false) . '</span>');
        } elseif (is_day()) {
            $page_title = sprintf(__('Archive for %s', THEME_DOMAIN), '<span class="archive-term">' . get_the_time('F jS, Y') . '</span>');
        } elseif (is_month()) {
            $page_title = sprintf(__('Archive for %s', THEME_DOMAIN), '<span class="archive-term">' . get_the_time('F, Y') . '</span>');
        } elseif (is_year()) {
            $page_title = sprintf(__('Archive for %s', THEME_DOMAIN), '<span class="archive-term">' . get_the_time('Y') . '</span>');
        } elseif (is_author()) {
            $page_title = __('Author Archive', THEME_DOMAIN);
        } elseif (isset($_GET['paged']) && !empty($_GET['paged'])) {
            $page_title = __('Blog Archive', THEME_DOMAIN);
        }
    }

    return $before_title . $page_title . $after_title;
}

/**
 * Displays the title for the archive currently being displayed depending on type
 * @param string $before_title
 * @param string $after_title
 * @param bool $no_html
 * @return void;
 */
function gc15_archive_title($before_title = "", $after_title = "", $no_html = false)
{
    echo gc15_get_archive_title($before_title, $after_title, $no_html);
}

/**
 * Returns the title for the search results with count and search term
 * @author Adrian Ortega
 *
 * @param bool $no_html
 * @return string
 */
function gc15_get_search_title($no_html = false)
{
    global $s;

    $search = new WP_Query("s=$s&showposts=-1");

    $key = esc_html($s);
    $count = $search->post_count;

    $articles_text = ($count > 1) ? 'Articles' : 'Article';
    $articles_found = sprintf(__('%1$s %2$s found', THEME_DOMAIN), $count, $articles_text);

    wp_reset_query();
    if ($no_html) {
        return sprintf(__('Search Results for: %s', THEME_DOMAIN), $key);
    } else {
        return sprintf(__('Search Results for: %1$s %2$s', THEME_DOMAIN), '<span class="search-term">' . $key . '</span>', '<span class="search-count">' . $articles_found . '</span>');
    }
}

/**
 * Displays the title for the search results with count and search term
 * @author Adrian Ortega
 *
 * @param bool $no_html
 * @return void
 */
function gc15_search_title($no_html = false)
{
    echo gc15_get_search_title($no_html);
}