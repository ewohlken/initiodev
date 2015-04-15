<?php
/**
 * This file houses functions that are meant to be used within templates.
 * @author Adrian Ortega
 * @subpackage GC15_Platform
 */


/**
 * Wraps the post thumbnail in an anchor element for previews or a div
 * element when on a single view.
 * @return void
 */
function gc15_post_thumbnail()
{
    if (post_password_required() || is_attachment() || !has_post_thumbnail())
        return;

    if (is_singular()):
        ?>
        <div class="post-thumbnail">
            <?php the_post_thumbnail() ?>
        </div>
    <?php else: ?>
        <a class="post-thumbnail" href="<?php the_permalink() ?>" title="<?php the_title() ?>">
            <?php the_post_thumbnail('post-thumbnail', array('alt' => get_the_title())) ?>
        </a>
    <?php endif;
}

/**
 * Determine whether blog/site has more than one category.
 *
 * @since Twenty Fifteen 1.0
 * @return bool
 */
function gc15_categorized_blog()
{
    if (false === ($all_the_cool_cats = get_transient('gc15_categories'))) {
        // Create an array of all the categories that are attached to posts.
        $all_the_cool_cats = get_categories(array(
            'fields' => 'ids',
            'hide_empty' => 1,

            // We only need to know if there is more than one category.
            'number' => 2,
        ));

        // Count the number of categories that are attached to the posts.
        $all_the_cool_cats = count($all_the_cool_cats);

        set_transient('gc15_categories', $all_the_cool_cats);
    }

    if ($all_the_cool_cats > 1) {
        // This blog has more than 1 category so twentyfifteen_categorized_blog should return true.
        return true;
    } else {
        // This blog has only 1 category so twentyfifteen_categorized_blog should return false.
        return false;
    }
}

/**
 * Displays pagination but replaces WordPress's classes with those that come
 * with Foundation 5
 * @return void
 */
function gc15_pagination()
{
    global $wp_query;

    $big = 999999999; // This needs to be an unlikely integer

    // For more options and info view the docs for paginate_links()
    // http://codex.wordpress.org/Function_Reference/paginate_links
    $paginate_links = paginate_links(array(
        'base' => str_replace($big, '%#%', get_pagenum_link($big)),
        'current' => max(1, get_query_var('paged')),
        'total' => $wp_query->max_num_pages,
        'mid_size' => 5,
        'prev_next' => True,
        'prev_text' => __('&laquo;'),
        'next_text' => __('&raquo;'),
        'type' => 'list'
    ));


    $paginate_links = str_replace("<ul class='page-numbers'>", "<ul class='pagination'>", $paginate_links);
    $paginate_links = str_replace('<li><span class="page-numbers dots">', "<li><a href='#'>", $paginate_links);
    $paginate_links = str_replace("<li><span class='page-numbers current'>", "<li class='current'><a href='#'>", $paginate_links);
    $paginate_links = str_replace("</span>", "</a>", $paginate_links);
    $paginate_links = str_replace("<li><a href='#'>&hellip;</a></li>", "<li><span class='dots'>&hellip;</span></li>", $paginate_links);
    $paginate_links = preg_replace("/\s*page-numbers/", "", $paginate_links);

    // Display the pagination if more than one page is found
    if ($paginate_links) {
        echo '<div class="pagination-centered">';
        echo $paginate_links;
        echo '</div>';
    }
}