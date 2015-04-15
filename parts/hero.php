<?php
/**
 * The template that displays the hero image on the homepage.
 * This file can be used to hard code a slider. For this demo, we're relying on the GC Kit plugin
 * that has a banner widget.
 *
 * @author Adrian Ortega
 * @subpackage GC15_Platform
 */
?>
<div class="hero">
    <?php if (function_exists('gc_kit_get_banners')): gc_kit_get_banners(); endif; ?>
</div>