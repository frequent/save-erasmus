/*globals window, document, RSVP, rJS, XMLHttpRequest, domsugar, Date, console */
/*jslint indent: 2, maxlen: 180 regexp: true*/
(function (window, document, RSVP, rJS, XMLHttpRequest, domsugar, Date) {
  "use strict";

  var NAV_ITEM_LIST = ".navigation ul",
    NAVIGATION = ".navigation",
    //HAMBURGER = ".hamburger-menu",
    OPEN = "open",
    CLOSE = "close",
    SCM_ITEM_LIST = ".scm-menu ul",
    INTERSECTION_OBSERVER = window.IntersectionObserver;

  function promiseEventListener(target, type, useCapture) {
    //////////////////////////
    // Resolve the promise as soon as the event is triggered
    // eventListener is removed when promise is cancelled/resolved/rejected
    //////////////////////////
    var handle_event_callback;

    function canceller() {
      target.removeEventListener(type, handle_event_callback, useCapture);
    }

    function resolver(resolve) {
      handle_event_callback = function (evt) {
        canceller();
        evt.stopPropagation();
        evt.preventDefault();
        resolve(evt);
        return false;
      };

      target.addEventListener(type, handle_event_callback, useCapture);
    }
    return new RSVP.Promise(resolver, canceller);
  }

  function observeImage(state, image_list) {
    if (!state.observer) {
      return;
    }
    image_list.forEach(function (image) {
      state.observer.observe(image);
    });
  }

  function loadImage(entries, observer) {
    entries.forEach(function (entry) {
      var img = entry.target;
      if (img.classList.contains("lazy")) {
        img.classList.remove("lazy");
        //img.setAttribute("src", img.getAttribute("data-src"));
        observer.unobserve(img);
      }
    });
  }

  function jio_ajax(param) {
    var xhr = new XMLHttpRequest();
    return new RSVP.Promise(function (resolve, reject) {
      var k;
      xhr.open(param.type || "GET", param.url, true);
      xhr.responseType = param.dataType || "";
      if (typeof param.headers === 'object' && param.headers !== null) {
        for (k in param.headers) {
          if (param.headers.hasOwnProperty(k)) {
            xhr.setRequestHeader(k, param.headers[k]);
          }
        }
      }
      xhr.addEventListener("load", function (e) {
        if (e.target.status >= 400) {
          return reject(e);
        }
        resolve(e);
      });
      xhr.addEventListener("error", reject);
      if (typeof param.xhrFields === 'object' && param.xhrFields !== null) {
        for (k in param.xhrFields) {
          if (param.xhrFields.hasOwnProperty(k)) {
            xhr[k] = param.xhrFields[k];
          }
        }
      }
      if (param.timeout !== undefined && param.timeout !== 0) {
        xhr.timeout = param.timeout;
        xhr.ontimeout = function () {
          return reject(xhr);
        };
      }
      if (typeof param.beforeSend === 'function') {
        param.beforeSend(xhr);
      }
      xhr.send(param.data);
    }, function () {
      xhr.abort();
    });
  }

  function renderSocialMediaList(social_media_list, container) {
    var child_list = [],
      item,
      i;
    for (i = 0; i < social_media_list.length; i += 1) {
      item = social_media_list[i];
      child_list.push(
        domsugar('li', [
          domsugar('a', {
            "href": item.href,
            "role": 'button',
            "aria-label": item.title,
            "title": item.title,
            "target": '_blank',
            "rel": "noopener noreferrer"
          }, [
            domsugar('i', {
              "class": item.icon_class_string
            })
          ])
        ])
      );
    }
    domsugar(container, child_list);    
  }

  function renderSitemap(sitemap, nav_menu, language) {
    var child_list =  [],
      i;

    for (i = 0; i < sitemap.child_list.length; i += 1) {
      child_list.push(
        domsugar('li', [
          domsugar('a', {
            text: sitemap.child_list[i].text,
            href: sitemap.child_list[i].href
          })
        ])
      );
    }

    domsugar(nav_menu, [
      child_list,
      /*
      domsugar("li", [
        domsugar("a", {
          'href': "./langues.html",
          'class': "lang-wrapper"
        }, [
          domsugar('i', {
            'class': "erasmus-lang erasmus-lang-" + language
          }),
          domsugar('span', {
            'class': "navbar-language",
            'text': "Langues"
          })
        ])
      ])
      */
    ]);
  }

  rJS(window)
    .declareMethod("render", function (html_content, parsed_content) {
      var gadget = this,
        state = {
          language_list: JSON.stringify(parsed_content.language_list || []),
          sitemap: JSON.stringify(parsed_content.sitemap || {}),
          page_title: parsed_content.page_title || "",
          portal_status_message: parsed_content.portal_status_message || "",
          html_content: html_content || "",
          footer_html_content: JSON.stringify(parsed_content.footer_html_content || ""),
          social_media_list : JSON.stringify(parsed_content.social_media_list || ""),
          render_count: this.state.render_count + 1,
          base_url: parsed_content.sitemap.href,
          current_language: parsed_content.language
        };
      if (INTERSECTION_OBSERVER !== undefined) {
        state.observer = new INTERSECTION_OBSERVER(loadImage, {"threshold": 0.5});
      }
      return gadget.changeState(state);
    })

    .onStateChange(function (modification_dict) {
      var gadget = this,
        language_list,
        document_list,
        child_list,
        i,
        div_list,
        input,
        html_content,
        div,
        container;

      if (modification_dict.hasOwnProperty('page_title')) {
        document.title = gadget.state.page_title;
      }
      if (modification_dict.hasOwnProperty('gadget_style_url')) {
        domsugar(gadget.element.querySelector('p#gadget_style_url'), {
          text: gadget.state.gadget_style_url
        });
      }
      if (modification_dict.hasOwnProperty('render_count')) {
        domsugar(gadget.element.querySelector('p#render_count'), {
          text: 'render count: ' + gadget.state.render_count
        });
      }
      if (modification_dict.hasOwnProperty('language_list')) {
        language_list = JSON.parse(gadget.state.language_list);
        if (language_list.length > 1) {
          child_list = [];
          for (i = 0; i < language_list.length; i += 1) {
            child_list.push(
              domsugar('li', [
                domsugar('a', {
                  href: language_list[i].href
                }, [
                  domsugar('span', {
                    text: language_list[i].text.toUpperCase()
                  })
                ])
              ])
            );
          }
          domsugar(gadget.element.querySelector('.languages'),
                   [domsugar('ul', child_list)]);
        }
      }
      if (modification_dict.hasOwnProperty('sitemap')) {
        renderSitemap(
          JSON.parse(gadget.state.sitemap),
          gadget.element.querySelector(NAV_ITEM_LIST),
          gadget.state.current_language
        );
      }
      if (modification_dict.hasOwnProperty('social_media_list')) {
        renderSocialMediaList(
          JSON.parse(gadget.state.social_media_list),
          gadget.element.querySelector(SCM_ITEM_LIST)
        );
      }
      if (modification_dict.hasOwnProperty('footer_html_content')) {
        domsugar(gadget.element.querySelector('footer'), [
          domsugar("section", {
            "class": "footer-content",
            "html": JSON.parse(gadget.state.footer_html_content)
          })
        ]);
      }
      if ((modification_dict.hasOwnProperty('form_html_content')) ||
          (modification_dict.hasOwnProperty('html_content'))) {
        if (gadget.state.form_html_content) {
          // In case of form, display it directly
          domsugar(gadget.element.querySelector('main'), [
            domsugar('div', {'class': 'form_container',
                             html: gadget.state.form_html_content
                            }),
            domsugar('div', {'class': 'notify_loading invisible'})
          ]);
           // Manually add require to input
          div_list = gadget.element.querySelector('main .form_container').querySelectorAll('div.required');
          for (i = 0; i < div_list.length; i += 1) {
            input = div_list[i].querySelector('input');
            if (input) {
              input.required = true;
            }
          }
          // Move container to easily manage hidden
          gadget.element.querySelector('main .notify_loading')
            .appendChild(gadget.element.querySelector('main .form_container .loading').parentElement);
        } else {
          // Try to find the Web Page content only
          div = document.createElement('div');
          div.innerHTML = gadget.state.html_content;
          input = div.querySelector('div.input');
          if (input) {
            html_content = input.firstChild;
            observeImage(gadget.state, html_content.querySelectorAll("img"));
            domsugar(gadget.element.querySelector('main'), [
              domsugar("section", {
                "class": "sec-layout-highlight",
                "html": html_content.innerHTML
              })
            ]);
          }
          return gadget.renderVideo();
        }
      }
    })
    .declareJob('renderVideo', function () {
      var gadget = this,
        iframe,
        video_placeholder = gadget.element.querySelector('div[data-youtube]'),
        promise_list = [],
        video_placeholder_list,
        i;
      if (video_placeholder && window.self === window.top) {
        domsugar(video_placeholder, [
          domsugar('iframe', {
            'allow': "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            'src': video_placeholder.getAttribute("data-youtube").replace("youtube.com", "youtube-nocookie.com"),
            'width': "80%",
            'height': "auto",
            'min-height': "315",
            'frameborder': "0",
            'loading': "lazy"
          })
        ]);
        iframe = video_placeholder.querySelector('iframe');
        return promiseEventListener(iframe, "load", "false");
      }

      if (window.self === window.top) {
        video_placeholder_list = gadget.element.querySelectorAll('div[data-peertube]');
        for (i = 0; i < video_placeholder_list.length; i += 1) {
          video_placeholder = video_placeholder_list[i];
          domsugar(video_placeholder, [
            domsugar('iframe', {
              'allow': "picture-in-picture",
              'sandbox': "allow-same-origin allow-scripts allow-popups",
              'src': video_placeholder.getAttribute("data-peertube"),
              'width': "80%",
              'height': "auto",
              'min-height': "315",
              'frameborder': "0",
              'loading': "lazy",
              'allowfullscreen': true
            })
          ]);
          iframe = video_placeholder.querySelector('iframe');
          promise_list.push(promiseEventListener(iframe, "load", "false"));
        }
      }
      return RSVP.all(promise_list);
    })
    /*
    .onEvent('click', function (evt) {
      var gadget = this,
        target_element = evt.target.closest(HAMBURGER),
        is_open = gadget.element.querySelector(NAVIGATION).classList.contains(OPEN);
      if (target_element !== null) {
        gadget.element.querySelector(NAVIGATION).classList.toggle(OPEN);
        target_element.classList.toggle(CLOSE);
      } else if (is_open) {
        gadget.element.querySelector(NAVIGATION).classList.toggle(OPEN);
        gadget.element.querySelector(HAMBURGER).classList.toggle(CLOSE);
      }
    }, false, false)
    */
    ;
    


}(window, document, RSVP, rJS, XMLHttpRequest, domsugar, Date));
