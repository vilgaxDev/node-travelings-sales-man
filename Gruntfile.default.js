module.exports = function(grunt) {
    require("time-grunt")(grunt);
    require("load-grunt-tasks")(grunt, {
        pattern: ["grunt-*", "!grunt-cli*"]
    });
    var modRewrite = require("connect-modrewrite");
    var serveStatic = require("serve-static");
    grunt.initConfig({
        copy: {
            all: {
                expand: true,
                cwd: "app",
                src: ["**"],
                dest: "build"
            },
            build: {
                expand: true,
                cwd: "app",
                src: [
                    "img/**/*.png",
                    "languages/**/*.json",
                    "css/*.css",
                    "*.html",
                    "*.js",
                    "favicon.ico",
                    "weathercheck.txt"
                ],
                dest: "build"
            },
            libs: {
                expand: true,
                cwd: "./",
                src: [
                    "bower_components/font-awesome/**",
                    "bower_components/leaflet/**",
                    "bower_components/leaflet.heightgraph/**"
                ],
                dest: "build"
            },
            // copies the slidervariables into the related bower_component
            sliderLess: {
                expand: true,
                cwd: "./",
                src: ["app/less/angularjs-slider.variables.less"],
                dest: "bower_components/angularjs-slider/src/",
                rename: function(dest) {
                    return dest + "variables.less";
                }
            }
        },
        // compiles slider less to css
        grunt: {
            sliderMakeCss: {
                gruntfile: "bower_components/angularjs-slider/Gruntfile.js",
                task: "css"
            }
        },
        watch: {
            options: {
                livereload: true
            },
            less: {
                files: [
                    "app/less/**/*.less",
                    "!app/less/angularjs-slider.variables.less"
                ],
                tasks: ["less:development"]
            },
            less_sliders: {
                files: ["app/less/angularjs-slider.variables.less"],
                tasks: ["copy:sliderLess", "grunt:sliderMakeCss"]
            },
            js: {
                files: ["app/**/*.js"]
            },
            html: {
                files: ["app/**/*.html"],
                tasks: ["ngtemplates"]
            }
        },
        // Clean build folder up
        clean: {
            task_rm_build: {
                src: ["build/*", "build"]
            },
            task_rm_build_unused: {
                src: [
                    "build/components",
                    "build/infrastructure",
                    "build/languages",
                    "build/js/",
                    "build/constants",
                    "build/values",
                    "build/css",
                    ".tmp"
                ]
            }
        },
        jshint: {
            all: ["build/js/*.js", "build/components/**/*.js"],
            options: {
                globals: {
                    _: false,
                    $: false,
                    angular: false,
                    orsApp: true
                },
                browser: true,
                devel: true,
                esnext: true
            }
        },
        htmlhint: {
            build: {
                options: {
                    "tag-pair": true,
                    "tagname-lowercase": true,
                    "attr-lowercase": true,
                    "attr-value-double-quotes": true,
                    "doctype-first": true,
                    "spec-char-escape": true,
                    "id-unique": true,
                    "head-script-disabled": false,
                    "style-disabled": true
                },
                src: ["build/index.html"]
            }
        },
        useminPrepare: {
            html: "build/index.html",
            options: {
                dest: "build"
            }
        },
        usemin: {
            html: ["build/index.html"],
            css: ["build/index.html"]
        },
        uglify: {
            options: {
                preserveComments: "false", //"some", "all",
                compress: false,
                mangle: false
            }
        },
        preprocess: {
            options: {
                inline: true,
                context: {
                    DEBUG: false
                }
            },
            html: {
                src: ["build/index.html"]
            }
        },
        jsdoc: {
            dist: {
                src: ["app/js/*.js", "app/components/**/*.js"],
                options: {
                    destination: "doc"
                }
            }
        },
        removelogging: {
            dist: {
                src: ["build/scripts.js", "build/vendor.js"] // Each file will be overwritten with the output!
            },
            namespace: ["console", "console.info", "console.warn"]
        },
        traceur: {
            options: {
                copyRuntime: "build/",
                //script: true,
                moduleNames: false,
                modules: "inline"
            },
            custom: {
                files: [
                    {
                        expand: true,
                        cwd: "app/",
                        src: [
                            "components/**/*.js",
                            "constants/**/*.js",
                            "values/**/*.js",
                            "infrastructure/**/*.js",
                            "js/**/*.js"
                        ],
                        dest: "build/"
                    }
                ]
            }
        },
        prettier: {
            files: {
                src: ["app/**/**.js"]
            }
        },
        connect: {
            dev: {
                options: {
                    hostname: "localhost",
                    port: 3005,
                    //base: 'src',
                    livereload: true,
                    open: true,
                    middleware: function(connect, options, middlewares) {
                        return [
                            modRewrite([
                                "!\\.html|\\.js|\\.txt|\\.ico|\\.svg|\\.map|\\.woff2|\\.woff|\\.ttf|\\.css|\\.png$ /index.html [L]"
                            ]),
                            connect().use(
                                "/bower_components",
                                serveStatic("./bower_components")
                            ),
                            connect().use(
                                "/node_modules",
                                serveStatic("./node_modules")
                            ),
                            serveStatic("./app")
                        ];
                    }
                }
            },
            build: {
                options: {
                    hostname: "localhost",
                    port: 3035,
                    open: true,
                    base: "./build",
                    middleware: function(connect) {
                        return [
                            //modRewrite(['^[^\\.]*$ /index.html [L]']),
                            modRewrite([
                                "!\\.html|\\.js|\\.txt|\\.ico|\\.svg|\\.map|\\.woff2|\\.woff|\\.ttf|\\.css|\\.png$ /index.html [L]"
                            ]),
                            serveStatic("./build")
                        ];
                    }
                }
            }
        },
        tags: {
            build: {
                src: ["build/traceur_runtime.js"],
                dest: "build/index.html"
            }
        },
        browserify: {
            turf: {
                src: "main.js",
                dest: "node_modules/turf.js",
                options: {
                    browserifyOptions: {
                        standalone: "turf"
                    }
                }
            }
        },
        ngconstant: {
            // Options for all targets
            options: {
                space: "  ",
                wrap: '"use strict";\n\n {%= __ngModule %}',
                name: "config"
            },
            // Environment targets
            local: {
                options: {
                    dest: "app/js/config.js"
                },
                constants: {
                    ENV: {
                        name: "local",
                        // change name_of_war_archive to the name of the ors backend war version you are using (e.g. openrouteservice-4.4.0)
                        geocode:
                            "http://localhost:8082/name_of_war_archive/geocode",
                        directions:
                            "http://localhost:8082/name_of_war_archive/routes",
                        isochrones:
                            "http://localhost:8082/name_of_war_archive/isochrones",
                        matrix:
                            "http://localhost:8082/name_of_war_archive/matrix",
                        pois:
                            "http://localhost:8082/name_of_war_archive/locations",
                        shortenlink: "https://api-ssl.bitly.com/v3/shorten",
                        mapsurfer:
                            "https://api.openrouteservice.org/mapsurfer/{z}/{x}/{y}.png",
                        landmarks: 'https://landmarks-api.openrouteservice.org/'
                    }
                }
            },
            ors: {
                options: {
                    dest: "app/js/config.js"
                },
                constants: {
                    ENV: {
                        name: "production",
                        geocode: "https://api.openrouteservice.org/geocode",
                        directions:
                            "https://api.openrouteservice.org/directions",
                        isochrones:
                            "https://api.openrouteservice.org/isochrones",
                        matrix: "https://api.openrouteservice.org/matrix",
                        pois: "https://api.openrouteservice.org/pois",
                        shortenlink: "https://api-ssl.bitly.com/v3/shorten",
                        mapsurfer:
                            "https://api.openrouteservice.org/mapsurfer/{z}/{x}/{y}.png",
                        landmarks: 'https://landmarks-api.openrouteservice.org/'
                    }
                }
            }
        },
        stripDebug: {
            dist: {
                files: {
                    "build/scripts.js": "build/scripts.js"
                }
            }
        },
        cacheBust: {
            taskName: {
                options: {
                    assets: [
                        "scripts.js",
                        "vendor.js",
                        "main.css",
                        "vendor.css"
                    ],
                    baseDir: "./build",
                    deleteOriginals: true
                },
                src: ["./build/index.html"]
            }
        },
        less: {
            development: {
                files: {
                    "app/css/ors-addresses.css": "app/less/ors-addresses.less",
                    "app/css/ors-common.css": "app/less/ors-common.less",
                    "app/css/ors-error.css": "app/less/ors-error.less",
                    "app/css/ors-extras.css": "app/less/ors-extras.less",
                    "app/css/ors-header.css": "app/less/ors-header.less",
                    "app/css/ors-icons.css": "app/less/ors-icons.less",
                    "app/css/ors-instructions.css":
                        "app/less/ors-instructions.less",
                    "app/css/ors-landmark.css": "app/less/ors-landmark.less",
                    "app/css/ors-layout.css": "app/less/ors-layout.less",
                    "app/css/ors-leaflet.css": "app/less/ors-leaflet.less",
                    "app/css/ors-loading.css": "app/less/ors-loading.less",
                    "app/css/ors-locations.css": "app/less/ors-locations.less",
                    "app/css/ors-modal.css": "app/less/ors-modal.less",
                    "app/css/ors-nav-profiles.css":
                        "app/less/ors-nav-profiles.less",
                    "app/css/ors-panel-isochrones.css":
                        "app/less/ors-panel-isochrones.less",
                    "app/css/ors-panel-routing.css":
                        "app/less/ors-panel-routing.less",
                    "app/css/ors-sidebar-outlet.css":
                        "app/less/ors-sidebar-outlet.less",
                    "app/css/ors-tooltips.css": "app/less/ors-tooltips.less"
                }
            }
        },
        ngtemplates: {
            orsApp: {
                cwd: "app",
                src: [
                    "components/**/*.html",
                    "includes/**/*.html",
                    "languages/**/*.json"
                ],
                dest: "app/js/templates.js"
            }
        }
    });
    grunt.registerTask(
        "ors",
        "Compiles all of the assets and copies the files to the build directory.",
        [
            "browserify:turf",
            "less:development",
            "prettier",
            "copy:sliderLess",
            "grunt:sliderMakeCss",
            "ngtemplates",
            "clean:task_rm_build",
            "copy:build",
            "ngconstant:ors",
            "traceur",
            "useminPrepare",
            "concat",
            "copy:libs",
            "uglify",
            "cssmin",
            "usemin",
            "preprocess",
            "tags",
            "clean:task_rm_build_unused",
            "stripDebug",
            "cacheBust",
            "connect:build:keepalive"
        ]
    );
    grunt.registerTask("dev", "Run local server for development purposes", [
        "less:development",
        "prettier",
        "copy:sliderLess",
        "grunt:sliderMakeCss",
        "browserify:turf",
        "ngtemplates",
        "ngconstant:ors",
        "connect:dev",
        "watch"
    ]);
    grunt.registerTask("ci", "Test build process with Travis", [
        "browserify:turf",
        "less:development",
        "prettier",
        "copy:sliderLess",
        "grunt:sliderMakeCss",
        "ngtemplates",
        "clean:task_rm_build",
        "copy:build",
        "ngconstant:ors",
        "traceur",
        "useminPrepare",
        "concat",
        "copy:libs",
        "uglify",
        "cssmin",
        "usemin",
        "preprocess",
        "tags",
        "clean:task_rm_build_unused",
        "stripDebug",
        "cacheBust"
    ]);
    grunt.registerTask(
        "ors_local",
        "Run local ors frontend server on local ors backend tomcat",
        [
            "less:development",
            "prettier",
            "copy:sliderLess",
            "grunt:sliderMakeCss",
            "browserify:turf",
            "ngtemplates",
            "ngconstant:local",
            "connect:dev",
            "watch"
        ]
    );
};
