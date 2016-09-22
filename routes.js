var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var modelfactory = require('./models/model-factory');
var session = require( 'express-session' )
var logger = require('./logs'); 
var uuidvalidate = require('uuid-validate');

module.exports = function(app){
    

    // app.use(session({secret: config.get('SECRET'), 
    //              saveUninitialized: true,
    //              resave: true}));
    

    
    app.get('/', function(req, res){
         var Flow= modelfactory.getModel("flow");
         Flow
            .find({is_public: true})
            .populate('creator')
            .exec(function (err, flows) {
              if (err) throw(err);
              return res.render('index', {user: req.user, flows: flows });
            });
    });

    app.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });
    
    app.get('/flow/new',ensureAuthenticated,function(req, res){
      res.render('./flow/new', { user: req.user });
    });

    app.get('/flow/edit/:flow_id',ensureAuthenticated,function(req, res){
         var Flow= modelfactory.getModel("flow");
         Flow.find({ flowid: req.params.flow_id }, function(err, flows) {
            if (err) throw err;
            if (flows.length>0)
                return res.render('./flow/edit', { flow: flows[0] });
            else 
                return res.render('./error',{error:"Flow does not exist!"});
            });

    });
    
    app.get('/flow/public',function(req, res){
        var Flow= modelfactory.getModel("flow");
         Flow
            .find({is_public: true})
            .populate('creator')
            .exec(function (err, flows) {
              if (err) throw(err);
              return res.render('./flow/shared', { flows: flows });
            });
        });

    app.get('/flow/shared',function(req, res){
         var Flow= modelfactory.getModel("flow");
         Flow
            .find({$and:[{is_public: true},{creator:{'$ne':req.user._id}}]})
            .populate('creator')
            .exec(function (err, flows) {
              if (err) throw(err);
              return res.render('./flow/shared', { flows: flows });
            });
        });
    

    app.route('/flow')
         .get(ensureAuthenticated,function(req, res){
             var Flow= modelfactory.getModel("flow");
            //  Flow.find({ creator: req.user._id }, function(err, flows) {
            //     if (err) throw err;
            //     return res.render('./flow/flows', { flows: flows });
            //     });
            Flow
                .find({ creator: req.user._id })
                .populate('creator')
                .exec(function (err, flows) {
                  if (err) throw(err);
                  return res.render('./flow/flows', { flows: flows });
                });

            
          })    
    
        .post(ensureAuthenticated,function(req,res){
            logger.debug(req.body.title);
            logger.debug(req.body.creator);
            
             var Flow= modelfactory.getModel("flow");
          
              var new_flow = new Flow({
                flowid:req.body.uri,
                title : req.body.title,
                description : req.body.description,
                doc: req.body.doc,
                creator : req.user._id,
                keywords:req.body.keywords,
                is_public: req.body.is_public=='on'? true : false
              });
              

              Flow.find({ flowid:new_flow.flowid},function(err,flow){
                if (flow.length==0){
                    new_flow.save(function(err){
                    if(err) throw err;
                  });
                }else{
                    Flow.remove({ flowid:new_flow.flowid},function(err){
                        if(err) throw err;
                        new_flow.save(function(err){
                            if(err) throw err;
                         });
                    })
                }
              });
              
              return res.redirect('/flow/'+new_flow.flowid);

        });
    
    app.route('/flow/:flow_id')
         .get(function(req, res,next){
        	 var flow_id = req.params.flow_id
             var Flow= modelfactory.getModel("flow");
             
             if (uuidvalidate(flow_id)){
            	 logger.info('UUID as ID was identified');
            	 res.redirect('/');
             }
             else{

	             Flow
	                .find({ flowid: flow_id })
	                .populate('creator')
	                .exec(function (err, flows) {
	                  if (err) throw(err);
	                  if (flows.length>0){
	                    if (flows[0].is_public){
	                        flows[0].is_readable = true;
	                        flows[0].is_writable = false;
	                    }
	                    
	                    if (req.user){
	                        if (flows[0].creator._id.toString() == req.user._id){
	                            flows[0].is_readable = true;
	                            flows[0].is_writable = true;
	                       }
	                    }
	                    
	
	                    if (flows[0].is_readable)
	                        return res.render('./flow/read', { flow: flows[0] });
	                    else
	                        return res.render('./error', { error: "You don't have permissions to access this flow!" });
	                }
	                else 
	                     return res.render('./error',{error:"The document you are looking for does not exist!"});
	                });
             }
            	 
            })
     

          // DELETE METHOD NOT SUPPORTED BY BROWSER
          .delete(ensureAuthenticated,function(req, res){
              var Flow= modelfactory.getModel("flow");
                Flow.remove({ flowid: req.params.flow_id }, function(err, flows) {
                if (err) throw err;
                return res.redirect('/flow');
                });
          });
    
     app.get('/flow/delete/:flow_id',ensureAuthenticated,function(req, res){
         var Flow= modelfactory.getModel("flow");
         Flow.find({ flowid: req.params.flow_id }, function(err, flows) {
                var Flow= modelfactory.getModel("flow");
                Flow.remove({ flowid: req.params.flow_id }, function(err, flows) {
                if (err) throw err;
                return res.redirect('/flow');
                });
         });
     })
     
     
     app.route('/flow/newresource/:flow_id')
        .get(ensureAuthenticated,function(req, res,next){
            return res.render('./resource/new',flow_id=req.params.flow_id);
        })
    
    
    app.get('/check_availability',function(req,res){
        var title = req.query.title;
        var proposed_uri = title.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
        var Flow= modelfactory.getModel("flow");
        Flow.find({ flowid: proposed_uri }, function(err, flows) {
            if(err){
                res.status(400)
                res.end("Service is temporary unavailable");
            }
            if (flows.length>0){
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