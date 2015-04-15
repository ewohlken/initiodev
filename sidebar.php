<?php
/**
 * The sidebar containing the main widget area
 *
 * @author Adrian Ortega <aortega@goldencomm.com>
 * @subpackage GC15_Platform
 */

if (has_nav_menu('sidebar-navigation') || is_active_sidebar('sidebar-widgets')) : ?>

    <?php if (has_nav_menu('sidebar-navigation')) : ?>
        <nav class="side-navigation" role="navigation">
            <?php
            // Sidebar navigation menu.
            wp_nav_menu(array(
                'menu_class' => 'nav-menu',
                'theme_location' => 'sidebar-navigation',
            ));
            ?>
        </nav>
    <?php endif; ?>

    <?php if (is_active_sidebar('sidebar-widgets')) : ?>
        <div class="widget-area" role="complementary">
            <?php dynamic_sidebar('sidebar-widgets'); ?>
        </div><!-- .widget-area -->
    <?php endif; ?>

<?php endif;