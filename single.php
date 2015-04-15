<?php
/**
 * The main single post template
 * @subpackage GC15_Platform
 */
?>

<?php get_header() ?>
    <div class="content">
        <div class="row">
            <div class="columns small-12 medium-9">
                <article <?php post_class('entry') ?> id="post-<?php the_ID(); ?>">
                    <?php while (have_posts()): the_post(); ?>
                        <header class="entry-header">
                            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>
                            <?php get_template_part('parts/post-meta') ?>
                        </header>

                        <?php gc15_post_thumbnail() ?>
                        <?php do_action('gc15_post_before_entry_content') ?>

                        <div class="entry-content">
                            <?php the_content() ?>
                        </div>

                        <footer class="entry-footer">
                            <p><?php the_tags() ?></p>
                        </footer>

                        <?php do_action('gc15_post_before_comments') ?>
                        <?php comments_template(); ?>
                        <?php do_action('gc15_post_after_comments') ?>

                    <?php endwhile ?>
                </article>
            </div>
            <div class="columns small-12 medium-3">
                <?php get_sidebar() ?>
            </div>
        </div>
    </div>
<?php get_footer() ?>