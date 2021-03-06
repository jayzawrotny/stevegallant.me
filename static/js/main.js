var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
Backbone.$ = $;


var App = {
  vent: _.extend({}, Backbone.Events),
  views: {},
  models: {},
  routers: {}
},

Pages = {
  pages: {
    'home': function () {
      return steveGallant.views.home;
    },
    'contact': function () {
      return steveGallant.views.contact;
    },
    'work': function () {
      return steveGallant.views.work;
    }
  },

  pageExists: function (page) {
    if (this.pages.hasOwnProperty(page)) {
      return true;
    }
    return false;
  },

  getPageView: function (page) {
    if (!this.pageExists(page)) {
      return false;
    }
    return this.pages[page]();
  }
},

Templates = {
  templates: {
    work: 'work-template',
    workCategory: 'work-category-template',
    workModal: 'modal-template',
    reel: 'reel-template'
  },

  _html: {},

  get: function (name) {
    if (this._html.hasOwnProperty(name)) {
      return this._html[name];
    }
    if (this.templates.hasOwnProperty(name)) {
      return this.set(name, this.load(this.templates[name]));
    }

    throw new Error("Template name: \"" + name + "\" does not exist.");
  },

  load: function (id) {
    return document.getElementById(id).innerHTML;
  },

  set: function (name, html) {
    this._html[name] = html;

    return html;
  }

};

App.routers.Workspace = Backbone.Router.extend({
  routes: {
    '!/home': 'home',
    '!/work/:work_id': 'showWork',
    '!/work': 'work',
    '!/resume': 'resume',
    '!/contact': 'contact',
    '*path': 'defaultPath'
  },

  home: function () {
    App.vent.trigger('navigate', 'home');
  },

  work: function () {
    App.vent.trigger('navigate', 'work');
  },

  showWork: function (work_id) {
    var work;
    if (steveGallant.views.workModal) {
      steveGallant.views.workModal.remove();
    }

    App.vent.trigger('navigate', 'work');

    work = steveGallant.models.works.get(work_id);
    steveGallant.views.workModal = new App.views.WorkModal({
      model: work
    });

    steveGallant.$el.append(steveGallant.views.workModal.$el);
    steveGallant.$el.find('#wrapper').addClass('has-modal');
  },

  resume: function () {
    // alert('resume');
    App.vent.trigger('navigate', 'resume');
  },

  contact: function () {
    // alert('contact');
    App.vent.trigger('navigate', 'contact');
  },

  defaultPath: function () {
    this.navigate('!/home', { trigger: true });
  }
});

App.models.Work = Backbone.Model.extend({});

App.models.WorkCollection = Backbone.Collection.extend({
  model: App.models.Work
});

App.models.WorkCategory = Backbone.Model.extend({});
App.models.WorkCategoryCollection = Backbone.Collection.extend({
  model: App.models.WorkCategory
});

App.views.Home = Backbone.View.extend({
  el: '#home',
  template: _.template(Templates.get('reel')),
  events: {
    'click .video': 'playReel'
  },

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    App.vent.on('navigate', this.onNavigate, this);
    this.image = new Image();
    this.image.src = '/static/images/play_reel_hover.svg';
    delete this.image;
  },

  onNavigate: function (name) {
    if (name !== 'home') {
      this.$el.find('.video .inner').html('&nbsp;');
    }
  },

  playReel: function (e) {
    e.preventDefault();
    this.$el.find('.video .inner').html(this.template({
      url: DataBootstrap.urls.ReelURL
    }));
  },

  render: function () {
    return this;
  }
});

App.views.WorkModal = Backbone.View.extend({
  className: 'modal-view',
  template: _.template(Templates.get('workModal')),
  events: {
    'click button.close': 'close',
    'click button.next': 'nextWork',
    'click button.prev': 'prevWork',
  },

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.modalTemplate = options.modalTemplate;
    this.render();
    $(document).on('keyup', _.bind(this.arrowKey, this));
  },

  arrowKey: function (e) {
    if (e.which === 37) {
      this.prevWork();
    }
    else if (e.which === 39) {
      this.nextWork();
    }
  },

  close: function (e) {
    var self = this;
    this.$el.removeClass('show-modal-animation');
    this.$el.addClass('hide-modal-animation');

    setTimeout(function () {
      self.remove();
      steveGallant.routers.workspace.navigate('!/work', { trigger: true });
    }, 301);

    steveGallant.$el.find('#wrapper').removeClass('has-modal');
    $(document.body).off('keypress');
  },

  getPosition: function () {
    var collection = steveGallant.models.works.where({ workCategory: this.model.get('workCategory') }),
    total = collection.length,
    index = collection.indexOf(this.model);
    return { index: index, length: total, collection: collection };
  },

  nextWork: function () {
    var info = this.getPosition(),
    model;

    if (info.index < info.length - 1) {
      model = info.collection[info.index + 1];
    } else {
      model = info.collection[0];
    }

    steveGallant.routers.workspace.navigate('!/work/' + model.get('id'));
    this.model = model;
    this.render();
  },

  prevWork: function () {
    var info = this.getPosition(),
    model;

    if (info.index > 0) {
      model = info.collection[info.index - 1];
    } else {
      model = info.collection[info.length - 1];
    }

    steveGallant.routers.workspace.navigate('!/work/' + model.get('id'));
    this.model = model;
    this.render();
  },

  render: function () {
    var info = this.getPosition();
    this.$el.html(this.template({
      model: this.model,
      index: info.index + 1,
      total: info.length
    }));
    this.$el.addClass('show-modal-animation');
    return this;
  }
});

App.views.WorkThumbnail = Backbone.View.extend({
  tagName: 'li',
  className: 'work',
  template: _.template(Templates.get('work')),
  events: {
    'click': 'showModal'
  },

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.render();
  },

  render: function () {
    this.$el.html(this.template({ model: this.model }));
    return this;
  },

  showModal: function (e) {
    e.preventDefault();
    steveGallant.routers.workspace.navigate('!/work/' + this.model.id, { trigger: true });
  }
});

App.views.WorkCategory = Backbone.View.extend({
  tagName: 'li',
  className: 'work-category',
  template: _.template(Templates.get('workCategory')),

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.views = {};
    this.modalView = {};
    this.render();
  },

  render: function () {
    this.$el.html(this.template({
      model: this.model
    }));
    this.$el.find('.works').html('');
    this.collection.each(function (model) {
      this._removeView(model.cid);
      this._addView(model);
      this.$el.find('.works').append(
                                     this.views[model.cid].render().$el
                                     );
    }, this);
    return this;
  },

  _addView: function (model) {
    var view = new App.views.WorkThumbnail({
      model: model
    });
    this.views[model.cid] = view;
    view.render();
  },

  _removeView: function (cid) {
    if (!this.views.hasOwnProperty(cid)) {
      return;
    }
    this.views[cid].remove();
    delete this.views[cid];
  }
});

App.views.Work = Backbone.View.extend({
  el: '#work',

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.views = {};
    this.workCollection = options.workCollection;
  },

  render: function () {
    this.$el.find('.work-categories').html('');
    this.collection.each(function (model) {
      this._removeView(model.cid);
      this._addView(model);
      this.$el.find('.work-categories').append(this.views[model.cid].render().$el);
    }, this);
    return this;
  },

  _addView: function (model) {
    var collection = new App.models.WorkCollection(this.workCollection.where({ workCategory: model.id })),
    view = new App.views.WorkCategory({
      model: model,
      collection: collection
    });
    this.views[model.cid] = view;
  },

  _removeView: function (cid) {
    if (!this.views.hasOwnProperty(cid)) {
      return;
    }
    this.views[cid].remove();
    delete this.views[cid];
  }
});

App.views.Contact = Backbone.View.extend({
  el: '#contact',
  events: {
    'submit form': 'submitForm',
    'click .send': 'submitForm'
  },

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.render();
  },

  submitForm: function (e) {
    var data = {},
    self = this;
    data.name = this.$el.find('#id_name').val();
    data.email = this.$el.find('#id_email').val();
    data.message = this.$el.find('#id_message').val();
    data.cartoon = this.$el.find('#id_cartoon').val();

    this.$el.find('.send').prop('disabled', true);
    $.post(DataBootstrap.urls.EmailAPI + 'create/', data)
    .done(function (data) {
      self.$el.find('.status').removeClass('error');
      self.$el.find('.status').text(data.message);
    })
    .fail(function (jqXHR, status, message) {
      self.$el.find('.status').removeClass('error');
      self.$el.find('.status').addClass('error').text(jqXHR.responseJSON.message);
      self.$el.find('.send').prop('disabled', false);
    });
  }
});


App.views.LayoutManager = Backbone.View.extend({
  events: {
    'click section.page': 'onSection'
  },

  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.currentView = false;
    this.app = options.app;
    App.vent.on('navigate', this.onNavigate, this);
  },

  onNavigate: function (data) {
    this.showPage(data);
  },

  onSection: function (e) {
    if (! this.$el.find(e.target).hasClass('page')) {
      return;
    }
    e.preventDefault();
    var name = $(e.currentTarget).attr('id');
    this.app.routers.workspace.navigate('!/' + name, { trigger: true });
  },

  showPage: function (name) {
    var self = this,
        id = '#' + name;

    $('html, body').animate({
      scrollTop: 0
    }, 300, 'swing', function () {
      self.$el.find('section').removeClass('active');
      self.$el.find(id).addClass('active');
      steveGallant.$el.find('#navbar li').removeClass('active');
      steveGallant.$el.find('#navbar li.' + name).addClass('active');
      if (Pages.pageExists(name)) {
        self.currentView = Pages.getPageView(name);
        self.currentView.render();
      } else {
        self.currentView = false;
      }
    });

  }

});

App.views.Main = Backbone.View.extend({
  initialize: function (options) {
    Backbone.View.prototype.initialize.apply(this, options);
    this.views = {};
    this.routers = {};
    this.models = {};
    this.templates = {};

    this.routers.workspace = new App.routers.Workspace();

    this.models.workCategories = new App.models.WorkCategoryCollection(DataBootstrap.WorkCategories);
    this.models.works = new App.models.WorkCollection(DataBootstrap.Works);
  },
  render: function () {
    this.views.layoutManager = new App.views.LayoutManager({
      el: '#l-main',
      app: this
    });
    this.views.home = new App.views.Home();
    this.views.contact = new App.views.Contact();
    this.views.work = new App.views.Work({
      collection: this.models.workCategories,
      workCollection: this.models.works
    });
    return this;
  }
});

window.steveGallant = new App.views.Main({ el: '.app-steve-portfolio' });
window.steveGallant.render();
Backbone.history.start();