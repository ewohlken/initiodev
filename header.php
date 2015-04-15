<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <?php // wp_title() is leveraged as it works perfectly with WP SEO by Yoast ?>
    <title><?php wp_title('') ?></title>

    <meta name="author" content="Name">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

    <?php do_action('gc15_html_head') ?>

    <?php // The favicon image needs to be replaced per client ?>
    <link rel="shortcut icon" href="<?php echo gc15_get_image('favicon.png');?>" type="image/png"/>
    <link rel="icon" href="<?php echo gc15_get_image('favicon.png');?>" type="image/png"/>

    <?php // We use WordPress's register and enqueue functions to add stylesheets and scripts into our theme ?>
    <?php wp_head() ?>

    <?php do_action('gc15_before_head_end') ?>
</head>
<body <?php body_class()?>>
<?php do_action('gc15_after_body') ?>
<div class="header">
    <?php get_template_part('parts/top-bar') ?>
</div>
<div class="container" role="document">
    <?php do_action('gc15_after_header') ?>
