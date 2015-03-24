using System;

using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Security;
using System.Collections;
using InteractiveLearning.Models;
using System.IO;
using System.Web.Caching;
using System.Data.SqlClient;
using System.Configuration;

namespace InteractiveLearning.Controllers
{

    [Authorize]
    public class AccountController : Controller
    {
        static String sUserName = null;
        //
        // GET: /Account/Index
        public ActionResult Index()
        {
            return View();
        }

        //
        // GET: /Account/Login

        [AllowAnonymous]
        public ActionResult Login()
        {
            return View();
        }

        //
        // POST: /Account/Login

        [AllowAnonymous]
        [HttpPost]
        public ActionResult Login(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid) 
            {
                if (Membership.ValidateUser(model.UserName, model.Password))
                {
                    FormsAuthentication.SetAuthCookie(model.UserName, model.RememberMe);

                
                        if (Url.IsLocalUrl(returnUrl))
                        {

                            return Redirect(returnUrl);
                        }
                        else
                        {

                            return RedirectToAction("Index", "Test");
                        }

                   
                  


                }
                else
                {
                    ModelState.AddModelError("", "The user name or password provided is incorrect.");
                }
           
            }
            

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/LogOff

        public ActionResult LogOff()
        {
            FormsAuthentication.SignOut();

            return RedirectToAction("Login", "Account");
        }


        public ActionResult ChangePicture()
        {
           
            return View();
        }

        [HttpPost]
        public ActionResult ChangePicture(PictureModelView model)
        {

            if (model.File != null && model.File.ContentLength > 0)
            {
                if (model.File.ContentType.Contains("image"))
                {

                    MembershipUser currentUser = Membership.GetUser(User.Identity.Name, userIsOnline: true);

                    String FileName = currentUser.Email + Path.GetExtension(model.File.FileName);
                    string filePath = Path.Combine(Server.MapPath("~/Content/UserUploadPic/"), Path.GetFileName(FileName));
                    model.File.SaveAs(filePath);

                    InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
                    User_Details temp = en.User_Details.First(u => u.EmailID == currentUser.Email);
                    temp.Image = FileName;
                    en.SaveChanges();
                    return RedirectToAction("Index", "Account");
                }
            }
            return View();

        }
        
        //GET: /Account/Register
        [AllowAnonymous]
        public ActionResult Register()
        {
             RegisterModel model =new RegisterModel();
             InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
                
             var res = en.Department_NED.Select(x=>x).ToList();
             model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");
          return View(model);
        }


        //
        // POST: /Account/Register
        [AllowAnonymous]
        [HttpPost]
        public ActionResult Register(RegisterModel model)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
                
            var res = en.Department_NED.Select(x => x).ToList();
            model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");


            if (ModelState.IsValid)
            {
                // Attempt to register the user
                MembershipCreateStatus createStatus;
                if (model.accounttype == "Student")
                {
                    Membership.CreateUser(model.Email, model.Password, model.Email, passwordQuestion: model.PasswordQuestion, passwordAnswer: model.PasswordAnswer, isApproved: true, providerUserKey: null, status: out createStatus);
                }

                else
                {
                    Membership.CreateUser(model.Email, model.Password, model.Email, passwordQuestion: model.PasswordQuestion, passwordAnswer: model.PasswordAnswer, isApproved: true, providerUserKey: null, status: out createStatus);
               
                }
                if (createStatus == MembershipCreateStatus.Success)
                {
                    FormsAuthentication.SetAuthCookie(model.UserName, createPersistentCookie: false);

                    try
                    {
                        User_Details createUser = new User_Details();
                        createUser.UserName = model.UserName;
                        createUser.Password = model.PasswordAnswer;
                        createUser.EmailID = model.Email;
                        createUser.AccountType = model.accounttype;
                        createUser.Batch = model.batch;
                        createUser.Dept_Id = model.dept;
                        if (model.accounttype == "Student")
                        {
                            createUser.Roll_No = model.rollno;
                            createUser.Enrollment = model.enroll;
                            createUser.Section = en.NED_Student_Data.Where(x => x.EnrollmentNo == model.enroll).Select(x => x.Section).FirstOrDefault();

                        }

                           if (model.accounttype == "Teacher")
                        {
                            createUser.PersNo = model.pers;
                        }
                        en.AddToUser_Details(createUser);
                        en.SaveChanges();

                    }
                    catch (Exception ex)
                    { }
                    return RedirectToAction("Login", "Account");
                }
                else
                {
                    ModelState.AddModelError("", ErrorCodeToString(createStatus));
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }


        [AllowAnonymous]
        public JsonResult Detail(string dept, string rollno, string batch)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
            int deptt = Convert.ToInt32(dept);
            var res = en.NED_Student_Data.Where(x => x.Department == deptt && x.Batch == batch && x.Std_RollNo == rollno).Select(x => x).FirstOrDefault();
            if (res != null)
            {
                return Json(new
                {
                    Std_name = res.Std_Name,
                    enrno = res.EnrollmentNo
                }, JsonRequestBehavior.AllowGet);
            }

            else
            {
                return Json(new
                {
                    Std_name = "Not found",
                    enrno = "Not found"
                }, JsonRequestBehavior.AllowGet);
          
            }
        }

            [AllowAnonymous]
     

        public JsonResult Teacherdata(string dept, string persno)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
            int deptt = Convert.ToInt32(dept);
            int persnoo = Convert.ToInt32(persno);
            string ress = en.Department_NED.Where(x => x.Dept_Id == deptt).Select(x => x.Dept_Name).FirstOrDefault();
            var res = en.NED_Teachers_Data.Where(x =>x.Pers_No == persnoo).Select(x => x).FirstOrDefault();
            if (res != null)
            {
                return Json(res.Employee_Name, JsonRequestBehavior.AllowGet);
            }

            else
            {
                return Json("Not found", JsonRequestBehavior.AllowGet);

            }
        } 
        
        //
        // GET: /Account/ChangePassword

       
        //
        // POST: /Account/ChangePassword
            public ActionResult ChangePassword()
            {

                return View();
            }
            #region PasswordRecovery
            [AllowAnonymous]
            public ActionResult PasswordReset()
            {
                return View();
            }

            [AllowAnonymous]
            [HttpPost]
            public ActionResult PasswordReset(PasswordResetModel model)
            {
                InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
                String status = en.User_Details.Where(x => x.EmailID == model.UserName).Select(x => x.EmailID).FirstOrDefault();

                if (status == null || status == "")
                {

                    ModelState.AddModelError("", "Invalid User");
                }
                else
                {
                    //user found
                    sUserName = model.UserName;
                    Response.Redirect("SetNewPassword");
                }
                return View();
            }

            [AllowAnonymous]
            public ActionResult SetNewPassword()
            {
                SetNewPasswordModel model = new SetNewPasswordModel();
                if (sUserName != null)
                {
                    model.PasswordQuestion = Membership.GetUser(Membership.GetUserNameByEmail(sUserName)).PasswordQuestion;
                }
                else
                {
                    Response.Redirect("PasswordReset");
                }

                return View(model);
            }
            [AllowAnonymous]
            [HttpPost]
            public ActionResult SetNewPassword(SetNewPasswordModel model)
            {

                if (ModelState.IsValid)
                {
                    InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
                    String answer = en.User_Details.Where(x => x.EmailID == sUserName).Select(x => x.Password).FirstOrDefault();
                    if (model.PasswordAnswer == answer)
                    {
                        string s = Membership.GetUser(Membership.GetUserNameByEmail(sUserName)).ResetPassword(model.PasswordAnswer);
                        Membership.GetUser(Membership.GetUserNameByEmail(sUserName)).ChangePassword(s, model.Password);
                        Response.Redirect("Login");

                    }
                    else
                    {
                        ModelState.AddModelError("", "Wrong Answer");
                        model.PasswordQuestion = Membership.GetUser(sUserName).PasswordQuestion;

                    }

                }

                else
                {
                    ModelState.AddModelError("", "");
                    model.PasswordQuestion = Membership.GetUser(sUserName).PasswordQuestion;
                }

                return View(model);
            }
            #endregion

        [HttpPost]
        public ActionResult ChangePassword(ChangePasswordModel model)
        {
            if (ModelState.IsValid)
            {

                // ChangePassword will throw an exception rather
                // than return false in certain failure scenarios.
                bool changePasswordSucceeded;
                try
                {
                    
                    MembershipUser currentUser = Membership.GetUser(User.Identity.Name, userIsOnline: true);
                    changePasswordSucceeded = currentUser.ChangePassword(model.OldPassword, model.NewPassword);
                }
                catch (Exception)
                {
                    changePasswordSucceeded = false;
                }

                if (changePasswordSucceeded)
                {
                    return RedirectToAction("ChangePasswordSuccess");
                }
                else
                {
                    ModelState.AddModelError("", "The current password is incorrect or the new password is invalid.");
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/ChangePasswordSuccess

        public ActionResult ChangePasswordSuccess()
        {
            return View();
        }

        #region Status Codes
        private static string ErrorCodeToString(MembershipCreateStatus createStatus)
        {
            // See http://go.microsoft.com/fwlink/?LinkID=177550 for
            // a full list of status codes.
            switch (createStatus)
            {
                case MembershipCreateStatus.DuplicateUserName:
                    return "A user name for that e-mail address already exists. Please enter a different e-mail address.";

                case MembershipCreateStatus.DuplicateEmail:
                    return "A user name for that e-mail address already exists. Please enter a different e-mail address.";

                case MembershipCreateStatus.InvalidPassword:
                    return "The password provided is invalid. Please enter a valid password value.";

                case MembershipCreateStatus.InvalidEmail:
                    return "The e-mail address provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidAnswer:
                    return "The password retrieval answer provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidQuestion:
                    return "The password retrieval question provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidUserName:
                    return "The user name provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.ProviderError:
                    return "The authentication provider returned an error. Please verify your entry and try again. If the problem persists, please contact your system administrator.";

                case MembershipCreateStatus.UserRejected:
                    return "The user creation request has been canceled. Please verify your entry and try again. If the problem persists, please contact your system administrator.";

                default:
                    return "An unknown error occurred. Please verify your entry and try again. If the problem persists, please contact your system administrator.";
            }
        }
        #endregion







    
    }
}
