<?php
/**
 * The main home page template. Use this to override the front page template.
 * @author Adrian Ortega <aortega@goldencomm.com>
 * @subpackage GC15_Platform
 */
?>

<?php get_header() ?>

<?php get_template_part('parts/hero') ?>
    <div class="content">
        <div class="row">
            <div class="columns small-12 medium-9">
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