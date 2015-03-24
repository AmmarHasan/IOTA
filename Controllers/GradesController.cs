using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using InteractiveLearning.Models;

namespace InteractiveLearning.Controllers
{
      [Authorize]
   
    public class GradesController  : BaseController
    {
        //
        // GET: /Grades/
        InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();

        public ActionResult Index()
        {
            Grades model = new Grades();
            model.g= en.Grades.Where(m => m.User_Details.UserID == LoggedInUserKey).Select(m => m).ToList();
            model.type = en.User_Details.Where(x => x.UserID == LoggedInUserKey).Select(x => x.AccountType).FirstOrDefault();
           return View(model);
           
        }

        public ActionResult Graph()
        {
            Grades model = new Grades();
            model.g = en.Grades.Where(m => m.User_Details.UserID == LoggedInUserKey).Select(m => m).ToList();
            model.type = en.User_Details.Where(x => x.UserID == LoggedInUserKey).Select(x => x.AccountType).FirstOrDefault();
            return View(model);
          
        }

    }
}
