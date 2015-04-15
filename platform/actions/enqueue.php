<?php
/**
 * Use this file to enqueue your scripts and stylesheets. By default, only two are included
 * as this theme was developed using Grunt and the scripts inside th js folder were
 * concatenated and minified into one file: js/app.min.js
 * @subpackage GC15_Platform
 * @author Adrian Ortega <aortega@goldencomm.com>
 */

add_action( 'wp_enqueue_scripts', 'gc15_enqueue_all' );
function gc15_enqueue_all(){
    gc15_enqueue_javascripts();
    gc15_enqueue_stylesheets();
}

/**
 * Register and enqueue stylesheets
 * @author Adrian Ortega
 * @return void
 */
function gc15_enqueue_stylesheets(){
    // register stylesheets
    wp_register_style('gc15', gc15_get_stylesheet('app.css'), array(), THEME_VERSION, 'all');

    // enqueue stylesheets
    wp_enqueue_style( 'gc15' );
}

/**
 * Register and enqueue javascripts
 * @author Adrian Ortega
 * @return void
 */
function gc15_enqueue_javascripts(){
    // deregister the jquery version bundled with WordPress
    wp_deregister_script( 'jquery' );

    // register scripts
    wp_register_script('jquery', gc15_get_vendor_script('jquery/jquery.min.js'), array(), '2.1.3 ', false);
    wp_register_script('gc15', gc15_get_script('app.js'), array('jquery'), THEME_VERSION, true);

    // enqueue scripts
    wp_enqueue_script('jquery');
    wp_enqueue_script('gc15');
}

