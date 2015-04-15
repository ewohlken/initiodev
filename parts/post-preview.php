<?php
/**
 * This is the main post template for archives, search results and blog rolls used in loops.
 * Can be easily called by the gc15_get_post_preview() function
 * @subpackage GC15_Platform
 */
?>
<article class="entry post-id-<?php the_ID() ?>">
    <header class="entry-header">
        <?php the_title( sprintf( '<h2 class="entry-title"><a href="%1$s" title="%2$s">', esc_url( get_permalink() ), get_the_title() ), '</a></h2>'); ?>
        <?php get_template_part('parts/post-meta') ?>
    </header>

    <?php gc15_post_thumbnail() ?>

    <div class="entry-content">
        <?php do_action('gc15_before_preview_content')?>

        <?php the_excerpt() ?>

        <?php do_action('gc15_after_preview_content')?>
    </div>

    <footer class="entry-footer">
        <?php get_template_part('parts/post-meta') ?>
    </footer>
</article>