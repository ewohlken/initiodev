<?php
/**
 * The main footer file. This can be used to created new footer template files by cloning it.
 * @author Adrian Ortega
 * @subpackage GC15_Platform
 */
?>
</div> <?php // closes the container opened in header.php?>
<footer class="footer">
    <div class="row">
        <?php do_action( 'gc15_before_footer' ) ?>
        <?php dynamic_sidebar( 'footer-widgets' ) ?>
        <?php do_action( 'gc15_after_footer' ) ?>
    </div>
</footer>
<?php // Nothing goes after this line ?>
<?php wp_footer() ?>
</body>
</html>