<?php
/**
 * The main template that displays a post's meta information such as post date and categories
 * @author Adrian Ortega <aortega@goldencomm.com>
 * @subpackage GC15_Platform
 */
?>

<?php

// If we're on the homepage and the post was stickied, show the featured flag
if (is_sticky() && is_home() && !is_paged()):
    echo '<span class="sticky-post">Featured</span>';
endif;

// The date and time the post was published
if (in_array(get_post_type(), array('post', 'attachment'))):
    $time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';

    if (get_the_time('U') !== get_the_modified_time('U')) {
        $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
    }

    $time_string = sprintf($time_string,
        esc_attr(get_the_date('c')),
        get_the_date(),
        esc_attr(get_the_modified_date('c')),
        get_the_modified_date()
    );

    printf('<span class="posted-on"><span class="screen-reader-text">%1$s </span><a href="%2$s" rel="bookmark">%3$s</a></span>',
        __('Posted on'),
        esc_url(get_permalink()),
        $time_string
    );
endif;

// The following will only show for posts with the post_type of post
if (get_post_type() == 'post'):
    if (is_singular() || is_multi_author()):
        printf('<span class="byline"><span class="author"><span>%1$s </span><a class="url fn n" href="%2$s">%3$s</a></span></span>',
            __('By'),
            esc_url(get_author_posts_url(get_the_author_meta('ID'))),
            get_the_author()
        );
    endif;

    $categories_list = get_the_category_list(', ');
    if ($categories_list && gc15_categorized_blog()):
        printf('<span class="cat-links"><span class="screen-reader-text">%1$s </span>%2$s</span>',
            __('Categories'),
            $categories_list
        );
    endif;

    $tags_list = get_the_tag_list('', ', ');
    if ($tags_list) {
        printf('<span class="tags-links"><span class="screen-reader-text">%1$s </span>%2$s</span>',
            __('Tags'),
            $tags_list
        );
    }
endif;