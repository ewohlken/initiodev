<?php
/**
 * @subpackage GC15_Platform
 */
?>

<div class="top-bar-container contain-to-grid show-for-medium-up">
    <nav class="top-bar" data-topbar role="navigation">
        <ul class="title-area">
            <li class="name">
                <h1><a href="<?php echo home_url(); ?>"><?php bloginfo('name'); ?></a></h1>
            </li>
        </ul>
        <section class="top-bar-section">
            <?php gc15_top_bar_menu(); ?>
        </section>
    </nav>
</div>
