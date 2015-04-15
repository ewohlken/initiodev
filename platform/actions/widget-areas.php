<?php
/**
 * Use this file to register widget areas within the theme
 * @subpackage GC15_Platform
 * @author Adrian Ortega <aortega@goldencomm.com>
 */

add_action( 'widgets_init', 'gc15_register_widget_areas' );
function gc15_register_widget_areas(){
    register_sidebar( array(
        'id'            => 'sidebar-widgets',
        'name'			=> __('Sidebar Widgets', THEME_DOMAIN),
        'description'	=> __('Drag widgets to this sidebar container.',THEME_DOMAIN),
        'before_widget' => '<div class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title'	=> '<h4 class="widget-title">',
        'after_title'	=> '</h4>',
    ) );

    register_sidebar( array(
        'id'            => 'footer-widgets',
        'name'          => __('Footer widgets', THEME_DOMAIN),
        'description'   => __('Drag widgets to this footer container', THEME_DOMAIN),
        'before_widget' => '<article id="%1$s" class="medium-4 columns widget %2$s">',
        'after_widget'  => '</article>',
        'before_title' => '<h4>',
        'after_title' => '</h4>'
    ) );
}