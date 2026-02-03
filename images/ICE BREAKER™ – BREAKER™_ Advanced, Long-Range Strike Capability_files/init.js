/*!
 * Wattaw Init
 */

const WattawPlugin = {
    /**
     * Config default settings
     */
    configDefaults : {
        /**
         * Multiple Selectors to open the modal
         */
        triggers : '.open-wattaw',

        /**
         * Render Color Contrast Section?
         */
        colorsContrast : true,

        /**
         * Pause Motion event names: (on window)
         */
        pauseMotionEventChecked : 'wattawMotionDisable',
        pauseMotionEventUnchecked : 'wattawMotionEnable',

        /**
         * Accessibility Statement
         */
        stmtLink : window.acbStmtLink || '',
        skipToContentTarget : window.skipToContentTarget || 'main',
        skipContentTrigger : window.skipContentTrigger || '.skip-content',
    },

    /**
     * Init plugin
     */
    init() {
        this.setupConfig();
        this.attachTriggers();
        this.colorsContrast();
        this.highlightLinks();
        this.pauseMotion();
        this.moveToMainContent();
        this.skipContent();
        this.statement();
        this.save();

        this.cancelAccessibility();
    },

    /**
     * Save form data into local storage
     */
    save() {
        let form = document.querySelector( '#wattaw form' );
        let inputs = form.querySelectorAll( 'input' );

        /**
         * On change update local storage
         */
        inputs.forEach( input => {
            input.addEventListener( 'change', () => {
                let formData = new FormData( form );
                let json = {};

                formData.forEach( ( v, k ) => {
                    json[ k ] = v;
                } );

                localStorage.setItem( 'wattaw', JSON.stringify( json ) );
            } );
        } );

        /**
         * Read from local storage
         */
        window.addEventListener( 'load', () => {
            setTimeout( () => {
                let currentState = JSON.parse( localStorage.getItem( 'wattaw' ) || '{}' );
                for ( let k in currentState ) {
                    let fieldInput = document.querySelector( 'input[name="' + k + '"][value="' + currentState[ k ] + '"]' );
                    if ( fieldInput ) {
                        fieldInput.checked = true;
                    }
                }

                /**
                 * Trigger events to make changes (if exists) from our local storage
                 */
                setTimeout( () => this.triggerChange( form ), 0 );
            }, 1000 );
        } );
    },

    /**
     * Attach event listeners to triggers elements on DOM.
     * It opens bootstrap modal.
     */
    attachTriggers() {
        this.config.triggers && document.querySelectorAll( this.config.triggers ).forEach( el => {
            el.setAttribute( 'data-bs-toggle', 'modal' );
            el.setAttribute( 'data-bs-target', '#wattaw' );
        } );
    },

    /**
     * Reset all
     */
    cancelAccessibility() {
        let btn = document.querySelector( '#wattaw-cancel-accessibility' );
        btn.addEventListener( 'click', () => {
            // reset form to initial state
            let form = document.querySelector( '#wattaw form' );
            form.reset();

            setTimeout( () => this.triggerChange( form ), 0 );
        } );
    },

    triggerChange( form ) {
        let changeEvent = new CustomEvent( "change" );

        // trigger change event on all inputs
        form.querySelectorAll( 'input' ).forEach( input => {
            input.dispatchEvent( changeEvent );
        } );
    },

    /**
     * Show\Hide accessibility statement if we have link
     */
    statement() {
        let group = document.querySelector( '#accessibility-statement-group' );
        if ( !this.config.stmtLink ) {
            group.remove();
        }

        group.querySelector( 'a' ).href = this.config.stmtLink;
    },

    /**
     * Highlight links checkbox
     */
    highlightLinks() {
        let input = document.querySelector( '#wattaw-hl-links' );

        let update = () => document.body.classList.toggle( 'wattaw-highlight-links', input.checked );

        input.addEventListener( 'change', update );

        update();
    },

    /**
     * Highlight links checkbox
     */
    pauseMotion() {
        let input = document.querySelector( '#wattaw-pause-motion' );

        this.pauseMotionEventChecked = this.pauseMotionEventChecked || new Event( this.config.pauseMotionEventChecked );
        this.pauseMotionEventUnchecked = this.pauseMotionEventUnchecked || new Event( this.config.pauseMotionEventUnchecked );

        let update = () => {
            document.body.classList.toggle( 'wattaw-pause-motion', input.checked )

            // send event
            if ( input.checked ) {
                window.dispatchEvent( this.pauseMotionEventChecked );
                document.querySelectorAll( 'lottie-player' ).forEach( i => {
                    i?.pause();
                } );
            } else {
                window.dispatchEvent( this.pauseMotionEventUnchecked );
                document.querySelectorAll( 'lottie-player' ).forEach( i => {
                    i?.play();
                } );
            }
        };

        input.addEventListener( 'change', update );

        update();
    },

    /**
     * Setup colors contrast
     */
    colorsContrast() {
        let group = document.querySelector( '#wattaw-colors-contrast' );

        if ( group && !this.config.colorsContrast ) {
            group.remove();
            return false;
        }

        if ( !group )
            return false;

        let update = () => {
            let value = document.querySelector( 'input[name=wattaw-cc]:checked' ).value;
            document.body.setAttribute( 'data-wattaw-contrast', value );
        };

        let inputs = document.querySelectorAll( 'input[name=wattaw-cc]' );
        inputs.forEach( input => input.addEventListener( 'change', update ) );

        update();
    },

    /**
     * Set up config using default values
     */
    setupConfig() {
        let cfg = window._wattawConfig || {};

        if ( cfg === null || typeof cfg != 'object' )
            cfg = {};

        /**
         * Set config
         */
        this.config = this.configDefaults;
        for ( let i in this.config ) {
            if ( i in cfg ) {
                this.config[ i ] = cfg[ i ];
            }
        }
    },
    moveToMainContent() {
        const el = document.getElementById( 'move-to-main' );
        el.setAttribute( 'href', '#' + this.config.skipToContentTarget );
    },
    skipContent() {
        const elements = document.querySelectorAll( this.config.skipContentTrigger );
        if ( !elements.length ) return;

        const beforeElement = document.createElement( 'a' );
        beforeElement.className = 'skip-content-before visually-hidden-focusable';
        beforeElement.href = '#!';
        beforeElement.onclick = (event) => event.target.nextElementSibling.nextElementSibling.focus();

        const afterElement = document.createElement( 'a' );
        afterElement.className = 'skip-content-after visually-hidden-focusable';
        afterElement.href = '#!';
        afterElement.onclick = (event) => event.target.nextElementSibling.nextElementSibling.focus();

        Array.from( elements ).map( el => {
            // Insert Before Element
            el.before( beforeElement );
            beforeElement.textContent = el.getAttribute('data-text-before') || 'Skip element'
            // Insert After Element
            el.after( afterElement );
            afterElement.textContent = el.getAttribute('data-text-after') || 'Skipped element'
        } )
    }
};

window.addEventListener( 'DOMContentLoaded', () => WattawPlugin.init() );