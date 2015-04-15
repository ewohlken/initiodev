<?php
/**
 * The main page template
 * @subpackage GC15_Template
 */
?>

<?php get_header() ?>
    <div class="content">
        <div class="row">
            <div class="columns small-12 medium-9">
                <article <?php post_class() ?> id="page-<?php the_ID(); ?>">
                    <?php while (have_posts()): the_post(); ?>
                        <header>
                            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>
                        </header>

                        <?php do_action('gc15_page_before_entry_content') ?>

                        <div class="entry-content">
                            <?php the_content() ?>
                        </div>
                    <?php endwhile ?>
                </article>
            </div>
            <div class="columns small-12 medium-3">
                <?php get_sidebar() ?>
            </div>
        </div>
    </div>
<?php get_footer() ?>