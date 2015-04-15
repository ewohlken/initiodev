<?php
/**
 * Menu function declares
 * @subpackage GC15_Platform
 */


/**
 * The main menu
 */
function gc15_top_bar_menu()
{
    wp_nav_menu(array(
        'container'         => false,                 // remove nav container
        'container_class'   => '',                    // class of container
        'menu'              => '',                    // menu name
        'menu_class'        => 'top-bar-menu right',   // adding custom nav class
        'theme_location'    => 'top-bar'  ,           // where it's located in the theme
        'before'            => '',                    // before each link <a>
        'after'             => '',                    // after each link </a>
        'link_before'       => '',                    // before each link text
        'link_after'        => '',                    // after each link text
        'depth'             => 5,                     // limit the depth of the nav
        'fallback_cb'       => false,                 // fallback function (see below)
        'walker'            => new GC15_TopBar()
    ));
}