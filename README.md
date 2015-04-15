# GoldenComm 2015 WordPress Baseline Theme

This is the WordPress baseline theme for GoldenComm 2015. This theme uses Foundation as its base for CSS and JavaScript Libraries

## Getting Started
First you will need to open your Git Bash or OS Terminal. Clone this repository to your themes folder ( **Note:** Before all of this, it is recommended that you set up an SSH key with BitBucket in order to have a secure connection without being bothered to put in your password)


    cd wp-content/themes/
    git clone git@bitbucket.org:goldencomm/gc15.git
 
The current version of GoldenComm's WordPress baseline uses Bower, Gulp and Foundation. You'll need to run the following in your terminal:


    npm install
    bower install    
    
That's it! you're all set. All dependencies and npm modules are installed automatically. Get developing by calling gulp directly

    gulp
  
## Folder Structures

**Note:** You must run `gulp` in your terminal for Sass and JavaScript files to be compiled, concatenated and minified. 

### Stylesheets

  * `style.css`: Do not worry about this file, it's required by WordPress. We handle all styling with Sass in the files described below.
  * `scss/app.scss`: Houses all the imports for Foundation components and all of your custom styling.
  * `scss/_settings.scss`: Original Foundation 5 base settings.
  * `scss/custom`: Use this folder to place any custom styling that does not fit into Foundation 5
  * `css/app.css`: All Sass files are compiled into this file.
  
### JavaScript

  * `js/`: Anything in this folder will be considered a production script.
  * `js/app.js`: This is the destination file for all concatenated and minified scripts using gulp
  * `src_js/`: This is where you pus all your custom scripts. Every .js file you put in this directory will be minified and concatinated to `app.min.js`