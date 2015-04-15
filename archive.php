<?php
/**
 * The main archive template.
 * Used for Authors, Categories, Post Type archives, Taxonomies, Dates, Tags,
 * Attachments and Posts
 *
 * @author Adrian Ortega <aortega@goldencomm.com>
 * @subpackage GC15_Platform
 */
?>

<?php get_header() ?>
    <div class="content">
        <div class="row">
            <div class="columns small-12 medium-9">
                <?php gc15_archive_title('<h2 class="archive-title">', '</h2>', true) ?>
                <?php if (have_posts()): ?>
                    <div class="entries">
                        <?php while (have_posts()): the_post(); ?>
                            <?php get_template_part('parts/post-preview') ?>
                        <?php endwhile ?>
                    </div>
                    <?php gc15_pagination() ?>
                <?php else: ?>
                    <?php get_template_part('parts/post-none') ?>
                <?php endif; ?>
            </div>
            <div class="columns small-12 medium-3">
                <?php get_sidebar() ?>
            </div>
        </div>
    </div>
<?php get_footer() ?>