<?php

/**
 * Register Menus
 * http://codex.wordpress.org/Function_Reference/register_nav_menus#Examples
 */
register_nav_menus(array(
    'top-bar'           => 'Top Bar', // registers the menu in the WordPress admin menu editor
    'mobile-off-canvas' => 'Mobile'
));


/**
 * Add support for buttons in the top-bar menu:
 * 1) In WordPress admin, go to Apperance -> Menus.
 * 2) Click 'Screen Options' from the top panel and enable 'CSS CLasses' and 'Link Relationship (XFN)'
 * 3) On your menu item, type 'has-form' in the CSS-classes field. Type 'button' in the XFN field
 * 4) Save Menu. Your menu item will now appear as a button in your top-menu
 */
function gc15_add_menuclass($ulclass) {
    $find = array('/<a rel="button"/', '/<a title=".*?" rel="button"/');
    $replace = array('<a rel="button" class="button"', '<a rel="button" class="button"');

    return preg_replace($find, $replace, $ulclass, 1);
}
add_filter('wp_nav_menu','gc15_add_menuclass');