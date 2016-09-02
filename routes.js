var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var modelfactory = require('./models/model-factory');
var session = require( 'express-session' )
var logger = require('./logs'); 

module.exports = function(app){
    

    // app.use(session({secret: config.get('SECRET'), 
    //              saveUninitialized: true,
    //              resave: true}));
    
    app.get('/signin', function(req, res){
      res.render('signin', { isSigninForm: true });
    });
    
    app.get('/', function(req, res){
         var Workflow= modelfactory.getModel("workflow");
         Workflow
            .find({is_public: true})
            .populate('creator')
            .exec(function (err, workflows) {
              if (err) throw(err);
              return res.render('index', {user: req.user, workflows: workflows });
            });
    });

    app.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });
    
    app.get('/workflow/new',ensureAuthenticated,function(req, res){
      res.render('./workflow/new', { user: req.user });
    });

    app.get('/workflow/edit/:workflow_id',ensureAuthenticated,function(req, res){
         var Workflow= modelfactory.getModel("workflow");
         Workflow.find({ workflowid: req.params.workflow_id }, function(err, workflows) {
            if (err) throw err;
            if (workflows.length>0)
                return res.render('./workflow/edit', { workflow: workflows[0] });
            else 
                return res.render('./error',{error:"Workflow does not exist!"});
            });

    });
    
    app.get('/flow/public',function(req, res){
        var Workflow= modelfactory.getModel("workflow");
         Workflow
            .find({is_public: true})
            .populate('creator')
            .exec(function (err, workflows) {
              if (err) throw(err);
              return res.render('./workflow/shared', { workflows: workflows });
            });
        });

    app.get('/workflow/shared',function(req, res){
         var Workflow= modelfactory.getModel("workflow");
         Workflow
            .find({$and:[{is_public: true},{creator:{'$ne':req.user._id}}]})
            .populate('creator')
            .exec(function (err, workflows) {
              if (err) throw(err);
              return res.render('./workflow/shared', { workflows: workflows });
            });
        });
    
    
    app.route('/workflow')
         .get(ensureAuthenticated,function(req, res){
             var Workflow= modelfactory.getModel("workflow");
            //  Workflow.find({ creator: req.user._id }, function(err, workflows) {
            //     if (err) throw err;
            //     return res.render('./workflow/workflows', { workflows: workflows });
            //     });
            Workflow
                .find({ creator: req.user._id })
                .populate('creator')
                .exec(function (err, workflows) {
                  if (err) throw(err);
                  return res.render('./workflow/workflows', { workflows: workflows });
                });

            
          })    
    
        .post(ensureAuthenticated,function(req,res){
            logger.debug(req.body.title);
            logger.debug(req.body.creator);
            
             var Workflow= modelfactory.getModel("workflow");
          
              var new_workflow = new Workflow({
                workflowid:req.body.uri,
                title : req.body.title,
                description : req.body.description,
                doc: req.body.doc,
                creator : req.user._id,
                keywords:req.body.keywords,
                is_public: req.body.is_public=='on'? true : false
              });
              

              Workflow.find({ workflowid:new_workflow.workflowid},function(err,workflow){
                if (workflow.length==0){
                    new_workflow.save(function(err){
                    if(err) throw err;
                  });
                }else{
                    Workflow.remove({ workflowid:new_workflow.workflowid},function(err){
                        if(err) throw err;
                        new_workflow.save(function(err){
                            if(err) throw err;
                         });
                    })
                }
              });
              
              return res.redirect('/workflow/'+new_workflow.workflowid);

        });
    
    app.route('/workflow/:workflow_id')
         .get(function(req, res,next){
             var Workflow= modelfactory.getModel("workflow");
             Workflow
                .find({ workflowid: req.params.workflow_id })
                .populate('creator')
                .exec(function (err, workflows) {
                  if (err) throw(err);
                  if (workflows.length>0){
                    if (workflows[0].is_public){
                        workflows[0].is_readable = true;
                        workflows[0].is_writable = false;
                    }
                    
                    if (req.user){
                        if (workflows[0].creator._id.toString() == req.user._id){
                            workflows[0].is_readable = true;
                            workflows[0].is_writable = true;
                       }
                    }
                    

                    if (workflows[0].is_readable)
                        return res.render('./workflow/read', { workflow: workflows[0] });
                    else
                        return res.render('./error', { error: "You don't have permissions to access this flow!" });
                }
                else 
                     return res.render('./error',{error:"The document you are looking for does not exist!"});
                });
            })
     

          // DELETE METHOD NOT SUPPORTED BY BROWSER
          .delete(ensureAuthenticated,function(req, res){
              var Workflow= modelfactory.getModel("workflow");
                Workflow.remove({ workflowid: req.params.workflow_id }, function(err, workflows) {
                if (err) throw err;
                return res.redirect('/workflow');
                });
          });
    
     app.get('/workflow/delete/:workflow_id',ensureAuthenticated,function(req, res){
         var Workflow= modelfactory.getModel("workflow");
         Workflow.find({ workflowid: req.params.workflow_id }, function(err, workflows) {
                var Workflow= modelfactory.getModel("workflow");
                Workflow.remove({ workflowid: req.params.workflow_id }, function(err, workflows) {
                if (err) throw err;
                return res.redirect('/workflow');
                });
         });
     })
     
     
     app.route('/workflow/newresource/:workflow_id')
        .get(ensureAuthenticated,function(req, res,next){
            return res.render('./resource/new',workflow_id=req.params.workflow_id);
        })
    
    
    app.get('/check_availability',function(req,res){
        var title = req.query.title;
        var proposed_uri = title.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
        var Workflow= modelfactory.getModel("workflow");
        Workflow.find({ workflowid: proposed_uri }, function(err, workflows) {
            if(err){
                res.status(400)
                res.end("Service is temporary unavailable");
            }
            if (workflows.length>0){
                 res.writeHead(418);
                 res.end('WRONG! URI has been used!');
            }else{
                res.status(200);
                res.send();
            }
        });
    })
    
    
    // Simple route middleware to ensure user is authenticated.
    //   Use this route middleware on any resource that needs to be protected.  If
    //   the request is authenticated (typically via a persistent login session),
    //   the request will proceed.  Otherwise, the user will be redirected to the
    //   login page.
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()){ 
          return next(); 
      }
      else{
         req.session.returnTo = req.path;
         res.redirect('/signin');
      }    

    }


}