<?php


/**
 * Displays the blog's parent site URL This is only to be used if the blog is a secondary site
 * and not the main site.
 *
 * @param string $path url to append to parent site
 * @param bool $echo can be set to false to return url instead of displaying
 * @return string
 */
function gc15_parent_site($path = '', $echo = true){
    $output = '#parent_url_is_invalid';
    if($parent_url = esc_url(PARENT_SITE)){
        if(substr($parent_url, -1) !== '/'){
            $parent_url = $parent_url.'/';
        }
        if(substr($path, 0, 1) == '/'){
            $path = substr($path, 1);
        }
        if($parent_url == 'http://replaceme.com/'){
            $output = '#parent_url_not_defined_in_functions';
        } else {
            $output = $parent_url.$path;
        }
    }
    if($echo){
        echo $output;
    }
    return $output;
}

/**
 * Legacy
 */
function parent_site($path = '', $echo = true)
{
    return gc15_parent_site($path, $echo);
}


/**
 * Returns the url of a given image
 * @author Adrian Ortega
 *
 * @param string|null $file
 * @return string
 */
function gc15_get_image($file = null)
{
    if(empty($file)) return '';
    return THEME_IMAGES.$file;
}

/**
 * Returns the url of a given script file
 * @author Adrian Ortega
 *
 * @param string|null $file
 * @param string|null $sub
 * @return string
 */
function gc15_get_script($file = null, $sub = null)
{
    if(empty($file)) return '';
    return empty($sub) ? THEME_JS.$file : THEME_JS."$sub/$file";
}

/**
 * Returns the url of a given stylesheet file
 * @author Adrian Ortega
 *
 * @param null $file
 * @return string
 */
function gc15_get_stylesheet($file = null){
    if(empty($file)) return '';
    return THEME_CSS.$file;
}

/**
 * Returns the url of a given vendor script by name
 * @author Adrian Ortega
 *
 * @param string|null $file
 * @return string
 */
function gc15_get_vendor_script($file = null)
{
    return gc15_get_script($file, 'vendor');
}

/**
 * Returns the url of a given custom script by name
 * @author Adrian Ortega
 *
 * @param null $file
 * @return string
 */
function gc15_get_custom_script($file = null)
{
    return gc15_get_script($file, 'custom');
}