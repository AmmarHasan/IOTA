using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using InteractiveLearning.Models;
using System.Web.Security;
using System.IO;
using System.Web.Hosting;
using System.Drawing;
using System.Web.Script.Services;
using System.Web.Services;
using System.Data.OleDb;
using System.Data.SqlClient;
using System.Data;
using System.Text;
namespace InteractiveLearning.Controllers
{
     [Authorize]
    public class TestController : BaseController
    {
        InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
        public ActionResult Index()
        {
            ViewTest model = new ViewTest();
            model.test = en.Tests.Where(x => x.Author == LoggedInUserKey).Select(x => x).ToList();
            model.type = en.User_Details.Where(x => x.UserID == LoggedInUserKey).Select(x => x.AccountType).FirstOrDefault();
            if (model.type != "Teacher")
                return RedirectToAction("Take");
            return View(model);
        }

        public ActionResult Take()
        {
            ViewTest model = new ViewTest();
            var user =en.User_Details.Where(x=>x.UserID == LoggedInUserKey).Select(x=>x).FirstOrDefault();
            model.test = en.Tests.Where(x => x.Author != LoggedInUserKey && x.Status == "Published" && x.IsOpen == true).Select(x => x).ToList();
            if (user.Section != null)
            {
                user.Section = user.Section.Replace(" ", "");
            }
            foreach (var item in en.Tests)
            {
               if (item.IsOpen == false)
                {
                    string sp = item.ForSections.Replace(" ", "");
                    
                    string[] r = sp.Split(',');
                    if (r.Length == 1)
                    {
                        string rv = r[0];
                        if (item.Batch == user.Batch && item.Department == user.Dept_Id && user.Section == rv && item.Author != LoggedInUserKey && item.Status == "Published")
                        {
                        model.test.Add(item);
                        }  
                    }
                    else if (r.Length == 2)
                    {
                        string rv = r[0];
                        string rv1 = r[1];

                        if (item.Batch == user.Batch && item.Department == user.Dept_Id && (user.Section == rv || user.Section == rv1) && item.Author != LoggedInUserKey && item.Status == "Published")
                        {
                            model.test.Add(item);
                        }
                       
                    }

                    else if (r.Length == 3)
                    {
                        string rv = r[0];
                        string rv1 = r[1];
                        string rv2 = r[2];

                        if (item.Batch == user.Batch && item.Department == user.Dept_Id && (user.Section == rv || user.Section == rv1 || user.Section == rv2) && item.Author != LoggedInUserKey && item.Status == "Published")
                        {
                            model.test.Add(item);
                        }
                       
                      
                    }


                    else if (r.Length == 4)
                    {
                        string rv = r[0];
                        string rv1 = r[1];
                        string rv2 = r[2];
                        string rv3 = r[3];

                        if (item.Batch == user.Batch && item.Department == user.Dept_Id && (user.Section == rv || user.Section == rv1 || user.Section == rv2 || user.Section == rv3) && item.Author != LoggedInUserKey && item.Status == "Published")
                        {
                            model.test.Add(item);
                        }
                      
                      
                    }
                    
                }
            }
            model.type = en.User_Details.Where(x => x.UserID == LoggedInUserKey).Select(x => x.AccountType).FirstOrDefault();
       
            return View(model);
        }

        public ActionResult TagSearch(string term)
        {
            // Get Tags from database
            var courses = en.Courses.Select(x => x.Name).ToList();
            List<String> tags = new List<String>();
            foreach (var item in courses)
            {
                tags.Add(item.ToString());
            }
            return this.Json(tags.Where(t => t.StartsWith(term)), JsonRequestBehavior.AllowGet);
        }

        public ActionResult Create(long? id)
        {
            var user = en.User_Details.Where(x => x.UserID == LoggedInUserKey).Select(x => x).FirstOrDefault();
         
          
                CreateTest model = new CreateTest();
                var res = en.Department_NED.Select(x => x).ToList();
                model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");
                model.sections = "All";
                model.noS = 1;
                model.sec = null;
                if (id != null)
                    ViewBag.courseid = id;
                return View(model);
            
        }
        [HttpPost]
        public ActionResult Create(CreateTest cTest, string Cid, string secPrivacy)
        {
            Test tst = new Test();
            tst.DateCreated = DateTime.UtcNow;
            tst.Title = cTest.test.Title;
            tst.IsOpen = cTest.isopen;
            tst.Batch = cTest.test.Batch;
            tst.Department = cTest.test.Department;
            tst.ForSections = secPrivacy;
            tst.QuesPerPage = cTest.test.QuesPerPage;
            if (tst.QuesPerPage == null)
            {
                tst.QuesPerPage = 0;
            }

            if (cTest.test.MaxQuestion != null)
            {
                tst.MaxQuestion = cTest.test.MaxQuestion;

            }
            else
            {
                tst.MaxQuestion = 0;
            }

            
            var course = en.Courses.Where(m => m.Name == cTest.test.Course.Name).Select(m => m).FirstOrDefault();
            if (course == null)
            {
                Course c = new Course();
                c.Name = cTest.test.Course.Name;
                en.Courses.AddObject(c);
                en.SaveChanges();
                tst.TopicID = c.ID;
            }
            else
                tst.TopicID = course.ID;
           
            tst.Description = cTest.test.Description;
            tst.Author = LoggedInUserKey;
            tst.Time = cTest.test.Time;
               if (tst.Time == true)
            {
                tst.MaxTime = cTest.test.MaxTime;
                if (tst.MaxTime == null)
                {
                    tst.Time = false;
                }
            }
        
           else
            {
                tst.MaxTime = null;
            }
            tst.Status = "Saved";
            en.Tests.AddObject(tst);
            en.SaveChanges();
            //Course Test
            if (Cid != null && Cid != "")
            {
               
            }

            cTest.testId = tst.TestID;
            cTest.noQ = 0;
            if (cTest.noS == 1)
            {
                return RedirectToAction("AddQuestion", new { cID = cTest.testId, num = cTest.noQ, sID= 0 });
            }
            else
                return RedirectToAction("SecDetails", new { cID = cTest.testId, num = cTest.noS });
        }

        private string ConvertImage(Bitmap sBit, string fname)
        {
            MemoryStream imageStream = new MemoryStream();
            sBit.Save(imageStream, System.Drawing.Imaging.ImageFormat.Png);

            return Convert.ToBase64String(imageStream.ToArray());
        }

        public ActionResult AddQuestion(long cID, int num, long sID, string imgdata)
        {
            CreateTest model = new CreateTest();
            if (sID == 0)
            {
                model.testId = cID;
                model.noQ = num;
                if (imgdata != null)
                {
                    //Bitmap sBit = new Bitmap(Server.MapPath("~/Content/TestImages/" + imgdata));
                    //string imageString = "data:image/png;base64," + ConvertImage(sBit, imgdata);
                    //ViewBag.im = imageString;
                    //model.imagedata = imageString;
                    model.imagedata = imgdata;
                    ViewBag.im = "../Content/TestImages/" + imgdata;
                }
            }
            else
            {
                model.secId = sID;
                model.testId = (long)en.TestSections.Where(x => x.Section_ID == sID).Select(x => x.TestID).FirstOrDefault();
                var res = en.Questions.Where(x => x.TestID == model.testId).GroupBy(x => x.SectionID).ToList();
                var res2 = en.TestSections.Where(x => x.TestID == model.testId).Select(x => x.Section_ID).ToList();
                model.noS = res2.Count();
                if (res.Count() == model.noS)
                {
                    model.allSec = true;
                }
                else
                    model.allSec = false;
                model.noQ = num;
                if (imgdata != null)
                {
                    model.imagedata = imgdata;
                    ViewBag.im = "../Content/TestImages/" + imgdata;
                }
            }
            return View(model);
        }
        [HttpPost]
        public ActionResult AddQuestion(CreateTest cTest)
        {
            string imgdata = cTest.imagedata;
            Question ques = new Question();
            if (cTest.question.QsImg == true)
            {
                ques.ImgFile = cTest.imagedata;//UploadImage(imgdata);
                ques.QsImg = true;
            }
            ques.Question1 = cTest.question.Question1;
            ques.Option1 = cTest.question.Option1;
            ques.Option2 = cTest.question.Option2;
            ques.Option3 = cTest.question.Option3;
            ques.Option4 = cTest.question.Option4;
            switch (cTest.question.CorrectAns)
            {
                case "Option A":
                    ques.CorrectAns = ques.Option1;
                    break;
                case "Option B":
                    ques.CorrectAns = ques.Option2;
                    break;
                case "Option C":
                    ques.CorrectAns = ques.Option3;
                    break;
                case "Option D":
                    ques.CorrectAns = ques.Option4;
                    break;
            }
            if (cTest.secId == 0)
            {
                ques.TestID = cTest.testId;
                en.Questions.AddObject(ques);
                en.SaveChanges();
                cTest.noQ++;
                return RedirectToAction("AddQuestion", new { cID = cTest.testId, num = cTest.noQ, sID = 0 });
            }
            else
            {
                ques.TestID = cTest.testId;
                ques.SectionID = cTest.secId;
                en.Questions.AddObject(ques);
                en.SaveChanges();
                cTest.noQ++;
                return RedirectToAction("AddQuestion", new { cID = cTest.testId, num = cTest.noQ, sID = cTest.secId });
            }
        }

        public ActionResult SecDetails(long cID, int num)
        {
            CreateTest model = new CreateTest();
            model.testId = cID;
            model.noS = num;
            model.type = "Teacher";
            return View(model);
        }
        [HttpPost]
        public ActionResult SecDetails(CreateTest model)
        {
            string[] quesC = model.secquesCount.Split(',');

            for (int i = 0; i < model.noS; i++)
            {
                TestSection sec = new TestSection();
                sec.SectionName = model.sec[i];
                sec.TestID = model.testId;
               sec.TestID = model.testId;
               if (quesC[i] != "")
               {
                   sec.QuesCount = Convert.ToInt32(quesC[i]);
               }
               else
               {
                   sec.QuesCount = 0;
               }
                en.TestSections.AddObject(sec);
            }
            en.SaveChanges();
            model.section = en.TestSections.Where(x => x.TestID == model.testId).Select(x => x).ToList();
            model.noQ = 0;
            return RedirectToAction("SecQuestion", new { testid = model.testId});
        }

        public ActionResult SecDetailsForOne(long cID, int num)
        {
            CreateTest model = new CreateTest();
            model.testId = cID;
            model.noS = num;
            model.type = "Teacher";
            return View(model);
        }
        [HttpPost]
        public ActionResult SecDetailsForOne(CreateTest model)
        {
            string quesC = model.secquesCount;

           TestSection sec = new TestSection();
                sec.SectionName = model.sec_ForOne;
                sec.TestID = model.testId;
                sec.TestID = model.testId;
                if (quesC != "")
                {
                    sec.QuesCount = Convert.ToInt32(quesC);
                }
                else
                {
                    sec.QuesCount = 0;
                }
                en.TestSections.AddObject(sec);
            
            en.SaveChanges();
            model.section = en.TestSections.Where(x => x.TestID == model.testId).Select(x => x).ToList();
            model.noQ = 0;
            return RedirectToAction("SecQuestion", new { testid = model.testId });
        }

        public ActionResult SecQuestion(long testid)
        {
            CreateTest model = new CreateTest();
            model.testId = testid;
            model.section = en.TestSections.Where(x=>x.TestID == testid).ToList();
            return View(model);
        }

        public ActionResult Publish(long testID)
        {
            var tst = en.Tests.Where(x => x.TestID == testID).Select(x => x).FirstOrDefault();
            tst.Status = "Published";
            en.SaveChanges();
               return RedirectToAction("Index");
           }
        
        public ActionResult EditTest(long id)
        {
            EditTest model = new EditTest();
            model.test = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
            model.isopen = (bool)model.test.IsOpen;
            var res = en.Department_NED.Select(x => x).ToList();
            model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");
            model.sec = en.TestSections.Where(x => x.TestID == id).Select(x => x).ToList();
            var itm = en.Questions.Where(x => x.TestID == id).ToList();
            if (model.test.MaxQuestion == 0)
            {
                model.test.MaxQuestion = itm.Count;
            }
            if (model.test.ForSections != null)
            {
                model.test.ForSections = model.test.ForSections.Replace(" ", "");
                model.sections = model.test.ForSections.Replace(" ", "");
            }
            return View(model);
        }
        [HttpPost]
        public ActionResult EditTest(EditTest model, string secPrivacy)
        {
            int empSec = 0;  /***********************************************************/
        
            var tst = en.Tests.Where(x => x.TestID == model.test.TestID).Select(x => x).FirstOrDefault();
            tst.Title = model.test.Title;
            tst.IsOpen = model.isopen;
            tst.Batch = model.test.Batch;
            tst.Department = model.test.Department;
            tst.QuesPerPage = model.test.QuesPerPage;
            if (model.test.MaxQuestion != null)
            {
                tst.MaxQuestion = model.test.MaxQuestion;

            }
            else
            {
                tst.MaxQuestion = 0;
            }
            if (tst.QuesPerPage == null)
            {
                tst.QuesPerPage = 0;
            }
            tst.ForSections = secPrivacy;
            if (tst.IsOpen == true)
            {
                tst.Batch = null;
                tst.Department = null;
                tst.ForSections = null;
            }
            if (tst.IsOpen == false && tst.Department != null && tst.Batch != null)
            {
                if (tst.ForSections == "" || tst.ForSections == null)
                {
                    tst.ForSections = "A,B,C,D";
                }
            }
            var course = en.Courses.Where(m => m.Name == model.test.Course.Name).Select(m => m).FirstOrDefault();
            if (course == null)
            {
                Course c = new Course();
                c.Name = model.test.Course.Name;
                en.Courses.AddObject(c);
                en.SaveChanges();
                tst.TopicID = c.ID;
            }
            else
            tst.TopicID = course.ID;
            tst.Description = model.test.Description;
            tst.Status = model.test.Status;
            if (tst.Status == "Published")
            {
                var q = en.Questions.Where(x => x.TestID == model.test.TestID).ToList();
                if (q.Count == 0)
                {
                    TempData["editTest"] = "There are no Questions in this Test. Test can not be published";
                    model.test.Status = "Saved";
                    tst.Status = "Saved";
                    en.SaveChanges();
                    model.sec = en.TestSections.Where(x => x.TestID == model.test.TestID).ToList();
                    model.isopen = (bool)tst.IsOpen;
                    var resss = en.Department_NED.Select(x => x).ToList();
                    model.Departments = new SelectList(resss, "Dept_Id", "Dept_Name");
      
                    return View(model);
                }
                var res = en.TestSections.Where(x=>x.TestID == model.test.TestID).Select(x=>x);
                foreach (var itm in res) /***********************START*************************************/
                {
                    var e = en.Questions.Where(x => x.SectionID == itm.Section_ID).Select(x => x).ToList();
                    if (e.Count == 0)
                    {
                        TempData["editTest"] = "There are no Questions in Section " + itm.SectionName + ".Test can not be published";
                        empSec = 1;
                        break;
                    }
                }
                if (empSec != 0)
                {
                    model.test.Status = "Saved";
                    tst.Status = "Saved";
                    en.SaveChanges();
                    model.sec = en.TestSections.Where(x => x.TestID == model.test.TestID).ToList();
                    model.isopen = (bool)tst.IsOpen;
                    var ress = en.Department_NED.Select(x => x).ToList();
                    model.Departments = new SelectList(ress, "Dept_Id", "Dept_Name");
      
                    return View(model);
                }/***************************************END*******************************************/
              
              }
            tst.Time = model.test.Time;
            if (tst.Time == true)
            {
                tst.MaxTime = model.test.MaxTime;
                if (tst.MaxTime == null)
                {
                    tst.Time = false;
                }
            }
            else
            {
                tst.MaxTime = null;
            }

          
          
            
            en.SaveChanges();

             return RedirectToAction("Index");
          }

        public ActionResult ViewQues(long id, long sID)
        {
            EditTest model = new EditTest();
            model.ques = en.Questions.Where(x => x.TestID == id).Select(x => x).ToList();
            model.sec = en.TestSections.Where(x => x.TestID == id).ToList();
            model.testId = id;
            model.secId = 0;
            var res = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
            ViewBag.titletest = res.Title;
            return View(model);
        }

        public ActionResult ViewSec(long id)
        {
            EditTest model = new EditTest();
            model.s= en.TestSections.Where(x => x.Section_ID == id).Select(x => x).FirstOrDefault();
            model.ques = en.Questions.Where(x => x.SectionID == id).Select(x => x).ToList();
            if (model.s.QuesCount == 0)
            {
                model.s.QuesCount = model.ques.Count;
            }
            return View(model);
        }

        public ActionResult DeleteQues(long id)
        {
            var res = en.Questions.Where(x => x.QuesID == id).Select(x => x).FirstOrDefault();
            if (res.QsImg != null)
            {
                var path = Path.Combine(Server.MapPath("~/Content/TestImages/"), res.ImgFile);
                System.IO.File.Delete(path);
            }
            long testId = res.TestID;
            var s = res.SectionID;
            en.DeleteObject(res);
            en.SaveChanges();
            if (s != null)
            {
                var q = en.Questions.Where(x => x.SectionID == s).ToList();
                if (q == null)
                {
                    var t = en.Tests.Where(x => x.TestID == testId).Select(x => x).FirstOrDefault();
                    t.Status = "Saved";
                    en.SaveChanges();
                    TempData["DelQues"] = "All Questions in this Section have been deleted. Test can't be published until every section contains question";
                }
                return RedirectToAction("ViewQues", new { id = testId,sID = s });
            }
            else
            {
                var qu = en.Questions.Where(x => x.TestID == testId).ToList();
                if (qu.Count == 0)
                {
                    var te = en.Tests.Where(x => x.TestID == testId).Select(x => x).FirstOrDefault();
                    te.Status = "Saved";
                    en.SaveChanges();
                    TempData["DelQue"] = "All Questions in this Test have been deleted. Test can't be published.!";
                }
                return RedirectToAction("ViewQues", new { id = testId, sID = 0 });
            }
        }

        public ActionResult DeleteSec(long id)
        {
            var res = en.Questions.Where(x => x.SectionID == id).Select(x => x).ToList();
            long test = (long)en.TestSections.Where(x=>x.Section_ID == id).Select(x=>x.TestID).FirstOrDefault();
            foreach (var item in res)
            {
                en.Questions.DeleteObject(item);
                en.SaveChanges();
            }
            var s = en.TestSections.Where(x => x.Section_ID == id).FirstOrDefault();
            en.TestSections.DeleteObject(s);
            en.SaveChanges();
            return RedirectToAction("EditTest", new { id= test});
        }

        public ActionResult UpdateSec(long sid, string sname, string sec_quesCount)
        {
            long test = (long)en.TestSections.Where(x => x.Section_ID == sid).Select(x => x.TestID).FirstOrDefault();
            var s = en.TestSections.Where(x => x.Section_ID == sid).FirstOrDefault();
            s.SectionName = sname;
            if (sec_quesCount != null && sec_quesCount != "")
            {
                s.QuesCount = Convert.ToInt32(sec_quesCount);
            }
            else

            {
                s.QuesCount = 0;
            }
            en.SaveChanges();
            return RedirectToAction("EditTest", new { id = test });
        }

        public ActionResult UpdateQues(long id,string imgdata)
        {
            EditTest model = new EditTest();
            model.q = en.Questions.Where(x => x.QuesID == id).Select(x => x).FirstOrDefault();
            if (imgdata != null)
            {
                model.q.ImgFile = imgdata;
            }
            return View(model);
        }
        [HttpPost]
        public ActionResult UpdateQues(EditTest model)
        {
            long testId = model.q.TestID;
            var ques = en.Questions.Where(x => x.QuesID == model.q.QuesID).Select(x => x).FirstOrDefault();
            ques.Question1 = model.q.Question1;
            ques.Option1 = model.q.Option1;
            ques.Option2 = model.q.Option2;
            ques.Option3 = model.q.Option3;
            ques.Option4 = model.q.Option4;
            if (model.q.ImgFile != null && model.q.ImgFile != "")
            {
                ques.QsImg = true;
                ques.ImgFile = model.q.ImgFile;
            }
            ques.CorrectAns = model.q.CorrectAns;
            en.SaveChanges();
            return RedirectToAction("ViewQues", new { id = testId, sID = 0});
        }

        public ActionResult TakeTest(long id)
        {
            TakeTest model = new TakeTest();
            model.test = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
            model.testId = id;
            if (model.test.Time == true)
                ViewBag.max = model.test.MaxTime;
            else
                ViewBag.max = "No time Limit";
            return View(model);
        }

        public ActionResult TakingTest(long id)
        {
            ViewBag.IsSection = "";
          
            TakeTest model = new TakeTest();
            model.testId = id;
            Random random = new Random();
            int seed = random.Next();
            model.rankey = seed;
            var res = en.TestSections.Where(x => x.TestID == id).ToList();
            int max = (int)en.Tests.Where(x => x.TestID == id).Select(x => x.MaxQuestion).FirstOrDefault();
            if (res.Count == 0)
            {
                var q = en.Questions.Where(x => x.TestID == id).Select(x => x).ToList();
                if (max < q.Count && max != 0)
                {
                    model.ques = en.Questions.Where(x => x.TestID == id).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).Take(max).ToList();
                }
                else
                    model.ques = en.Questions.Where(x => x.TestID == id).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).ToList();
                model.test = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
                if (model.test.MaxTime == null)
                {
                    model.test.MaxTime = -1;
                }
                  ViewBag.IsSection = "No";
            }
            else
            {
                model.sec = en.TestSections.Where(x => x.TestID == id).ToList();
                model.ques = new List<Question>();
                foreach (var item in model.sec)
                {
                    int quesCount = (int)item.QuesCount;
                    List<Question> resc = new List<Question>();
                  
                    var ress = en.Questions.Where(x => x.TestID == id && x.SectionID == item.Section_ID).Select(x => x).ToList();
                  
                    if (quesCount < ress.Count() && quesCount != 0)
                    {
                        resc = en.Questions.Where(x => x.TestID == id && x.SectionID == item.Section_ID).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).Take(quesCount).ToList();

                    }
                    else
                    {
                         resc = en.Questions.Where(x => x.TestID == id && x.SectionID == item.Section_ID).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).ToList();

                    }
                    foreach (var itm in resc)
                    {
                        model.ques.Add(itm);
                    }
                   
                }
                model.test = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
                if (model.test.MaxTime == null)
                {
                    model.test.MaxTime = -1;
                }
                  ViewBag.IsSection = "Yes";
            }
            return View(model);
        }
        [HttpPost]
        public ActionResult TakingTest(TakeTest model)
        {
            Grade g = new Grade();
            g.Date = DateTime.UtcNow;
            g.UserID = LoggedInUserKey;
            g.TestID = model.testId;
            g.Title = en.Tests.Where(x=>x.TestID == model.testId).Select(x=>x.Title).FirstOrDefault();
            var rese = en.TestSections.Where(x => x.TestID == model.testId).ToList();
           
            int count = 0;
            float per = 0;
            int max = (int)en.Tests.Where(x => x.TestID == model.testId).Select(x => x.MaxQuestion).FirstOrDefault();
            int seed = model.rankey;
            var q = en.Questions.Where(x => x.TestID == model.testId).Select(x => x).ToList();
            if (rese.Count == 0)
            {

                if (max < q.Count)
                {
                    model.ques = en.Questions.Where(x => x.TestID == model.testId).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).Take(max).ToList();
                }
                else
                    model.ques = en.Questions.Where(x => x.TestID == model.testId).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).ToList();
            }


            else
            {
                model.sec = en.TestSections.Where(x => x.TestID == model.testId).ToList();
                model.ques = new List<Question>();
                foreach (var item in model.sec)
                {
                    int quesCount = (int)item.QuesCount;
                    List<Question> resc = new List<Question>();

                    var ress = en.Questions.Where(x => x.TestID == model.testId && x.SectionID == item.Section_ID).Select(x => x).ToList();

                    if (quesCount < ress.Count() && quesCount != 0)
                    {
                        resc = en.Questions.Where(x => x.TestID == model.testId && x.SectionID == item.Section_ID).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).Take(quesCount).ToList();

                    }
                    else
                    {
                        resc = en.Questions.Where(x => x.TestID == model.testId && x.SectionID == item.Section_ID).Select(x => x).OrderBy(x => (~(x.QuesID & seed)) & (x.QuesID | seed)).ToList();

                    }
                    foreach (var itm in resc)
                    {
                        model.ques.Add(itm);
                    }

                }

            }
                foreach (var item in model.ques.Select((value, i) => new { i, value }))
            {
                if (model.ans[item.i] == item.value.CorrectAns)
                {
                    count++;
                }
            }
            g.Score = count;
            g.OutOf = model.ques.Count;
            per = ((float)count / (float)model.ques.Count) * 100;
            if (per >= 90)
                g.GradeID = 1;
            else if (per >= 80)
                g.GradeID = 2;
            else if (per >= 70)
                g.GradeID = 3;
            else if (per >= 60)
                g.GradeID = 4;
            else if (per >= 50)
                g.GradeID = 5;
            else
                g.GradeID = 6;
            en.Grades.AddObject(g);
            en.SaveChanges();
            Result res = new Result();
            res.gr = g;
            res.noQ = model.ques.Count;
            res.t = en.Tests.Where(x => x.TestID == model.testId).Select(x => x).FirstOrDefault();
            res.ans = model.ans;
            res.ques = model.ques;
            TempData["model"] = res;

      
            return RedirectToAction("Result");
        }

        public ActionResult Result()
        {
            var myModel = TempData["model"];
            ViewBag.subject = TempData["subject"];
            return View(myModel);
        }

        public ActionResult ViewResult(long id)
        {
            VResult model = new VResult();
            model.g = en.Grades.Where(x => x.TestID == id).ToList();
            if(model.g.Count >0)
            {
            model.outof = (int)en.Grades.Where(x => x.TestID == id).Select(x => x.OutOf).Take(1).FirstOrDefault();
            }
            model.testID = id;
            model.title = en.Tests.Where(x => x.TestID == id).Select(x => x.Title).FirstOrDefault();
            return View(model);
        }

        public ActionResult ViewGraph(long id)
        {
            VGraph model = new VGraph();
            model.g = new List<grad>();
            var g = en.Grades.Where(x => x.TestID == id).GroupBy(x => x.Score).Select(x => x);
            model.sum_std = 0;
            int i = 0;
            foreach (var item in g)
            {
                grad gs = new grad();
                gs.num = item.Count();
                gs.key = item.Key.Value;
                model.sum_std += gs.num;
                model.g.Insert(i, gs);
                i++;
            }
            return View(model);
        }

        public ActionResult AnswerSheet(Result model)
        {
            return View(model);
        }
        public void SaveExcel(int id)
        {

            var res = en.Grades.Where(x => x.TestID == id).ToList();
            string fname=en.Tests.Where(x=>x.TestID == id).Select(x=>x.Title).FirstOrDefault();
            var sb = new StringBuilder();

            int i=0;
            sb.AppendLine("S.No\tEnrollment No\tRoll No\tName\tScore\tOut of\tDate");
            foreach (var rec in res)
            {
                i++;
                sb.AppendFormat("{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}", i, rec.User_Details.Enrollment, rec.User_Details.Roll_No, rec.User_Details.UserName, rec.Score, rec.OutOf, rec.Date.Value.ToLocalTime());
                sb.AppendLine();
            }
            //Get current response
            var response = HttpContext.Response;
            response.BufferOutput = true;
            response.Clear();
            response.ClearHeaders();
            response.ContentEncoding = Encoding.Unicode;
            //file Name
            response.AddHeader("content-disposition", "attachment;filename=" + fname + "_Result.xls");
            response.ContentType = "application/vnd.ms-excel";
            response.Write(sb.ToString());
            response.End();



           
        }
        //[HttpPost]
        public ActionResult Delete(long id)
        {
            var q = en.Questions.Where(x => x.TestID == id).ToList();
            foreach (var item in q)
            {
                if (item.QsImg != null)
                {
                    var path = Path.Combine(Server.MapPath("~/Content/TestImages/"), item.ImgFile);
                    System.IO.File.Delete(path);
                }
          
                en.Questions.DeleteObject(item);
                en.SaveChanges();
            }
            var s = en.TestSections.Where(x => x.TestID == id).ToList();
            foreach (var x in s)
            {
                en.TestSections.DeleteObject(x);
                en.SaveChanges();
            }

           
            var res = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
            en.Tests.DeleteObject(res);
            en.SaveChanges();
                return RedirectToAction("Index");
             }


        public ActionResult ImportQuestion(long id,long secid)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
            UploadQuestion model = new UploadQuestion();
            var ress = en.TestSections.Where(x => x.TestID == id).Select(x => x).ToList();
            model.Sections = new SelectList(ress, "Section_ID", "SectionName");
            model.sec = secid;
            model.testid = id;
            TempData["fileMessage"] = "null";
            return View(model);
        }

         [HttpPost]

       public ActionResult ImportQuestion(UploadQuestion model)
         {

         InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();

         var ress = en.TestSections.Where(x => x.TestID == model.testid).Select(x => x).ToList();
         model.Sections = new SelectList(ress, "Section_ID", "SectionName");
           
            if (Request.Files["FileUpload1"].ContentLength > 0)
            {
                string extension = System.IO.Path.GetExtension(Request.Files["FileUpload1"].FileName);
                string path1 = string.Format("{0}/{1}", Server.MapPath("~/Content/UploadedTestFolder"), Request.Files["FileUpload1"].FileName);
                if (System.IO.File.Exists(path1))
                    System.IO.File.Delete(path1);

                Request.Files["FileUpload1"].SaveAs(path1);
                string excelConnectionString = @"Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + path1 + ";Extended Properties=Excel 12.0;Persist Security Info=False";

                string sqlConnectionString = System.Configuration.ConfigurationManager.ConnectionStrings["ApplicationServices"].ConnectionString;

                //Create Connection to Excel work book
                OleDbConnection excelConnection = new OleDbConnection(excelConnectionString);
                try
                {
                    excelConnection.Open();
                    DataTable dtExcelSchema;
                    dtExcelSchema = excelConnection.GetOleDbSchemaTable(OleDbSchemaGuid.Tables, null);
                    excelConnection.Close();
                    string sheetName = dtExcelSchema.Rows[0]["TABLE_NAME"].ToString();
                    //Create OleDbCommand to fetch data from Excel
                    OleDbCommand cmd = new OleDbCommand("Select [Question],[Option A],[Option B],[Option C],[Option D],[Correct Ans] from [" + sheetName + "]", excelConnection);

                    excelConnection.Open();
                    OleDbDataReader dReader;
                    dReader = cmd.ExecuteReader();
                    int count = 0;
                    string ques = "";
                    string optionA = "";
                    string optionB = "";
                    string optionC = "";
                    string optionD = "";
                    string correctAns = "";
                    int flag = 0;
                    string err = "";
                    var resQues = en.Questions.Where(x => x.TestID == model.testid).ToList();
                        
                    while (dReader.Read())
                    {
                      
                        ques = dReader[0].ToString();//Here we are calling the valid method
                        optionA = dReader[1].ToString();
                        optionB = dReader[2].ToString();
                        optionC = dReader[3].ToString();
                        optionD = dReader[4].ToString();
                        correctAns = dReader[5].ToString();
                        int flagq = 0;
                        if (resQues.Count > 0)
                        {
                            foreach (var item in resQues)
                            {
                                if (item.Question1 == ques)
                                    flagq = 1;
                            }
                        }
                        if ((ques != null && ques != "") && (optionA != null && optionA != "") && (optionB != null && optionB != "") && (optionC != null && optionC != "") && (optionD != null && optionD != "") && (correctAns != null && correctAns != ""))
                        {
                            try
                            {
                               
                                if (flagq != 1)
                                {
                                    Question quess = new Question();

                                    quess.Question1 = ques;
                                    quess.Option1 = optionA;
                                    quess.Option2 = optionB;
                                    quess.Option3 = optionC;
                                    quess.Option4 = optionD;
                                    quess.CorrectAns = correctAns;
                                    quess.TestID = model.testid;
                                    if (model.sec != 0)
                                    {
                                        quess.SectionID = model.sec;

                                    }
                                    count++;
                                    en.AddToQuestions(quess);
                                }
                            }
                            catch (Exception ex)
                            {
                                err = ex.Message.ToString();
                                flag = 1;
                            }
                        }
                    }



                    if (flag == 1)
                    {
                        TempData["fileMessage"] = err;

                    }
                    else
                    {
                        TempData["fileMessage"] = count.ToString() + "records inserted";
                        if (count == 0)
                        {
                            TempData["fileMessage"] =  "Record already exists";
                       
                        }

                    }

                    en.SaveChanges();
                    excelConnection.Close();


                }


                catch (Exception ex)
                {
                    TempData["fileMessage"] = ex.Message.ToString();


                }

            }
            return View(model);
      
        }
        public FileResult DownloadTemplate()
        {
            DirectoryInfo dirInfo = new DirectoryInfo(HostingEnvironment.MapPath("~/Content/TemplateQuestion"));
            var FilePath = dirInfo.FullName + @"\" + "Template_ImportQuestions.xlsx";
            return File(FilePath, System.Net.Mime.MediaTypeNames.Application.Octet, "Template_ImportQuestions.xlsx");
        }

        public ActionResult SaveQs(long id)
        {

            var res = en.Questions.Where(x => x.TestID == id).ToList();
            string fname = en.Tests.Where(x => x.TestID == id).Select(x => x.Title).FirstOrDefault();
            var sb = new StringBuilder();

            int i = 0;
            sb.AppendLine("S.No\tQuestion\tOption1\tOption2\tOption3\tOption4\tCorrect Ans\tSection Name");
            foreach (var rec in res)
            {
                i++;
                if(rec.SectionID !=null)
                sb.AppendFormat("{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}", i, rec.Question1, rec.Option1, rec.Option2, rec.Option3, rec.Option4,rec.CorrectAns,rec.TestSection.SectionName);
                else
                    sb.AppendFormat("{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}", i, rec.Question1, rec.Option1, rec.Option2, rec.Option3, rec.Option4, rec.CorrectAns,"No section");
               
                sb.AppendLine();
            }
            //Get current response
            var response = HttpContext.Response;
            response.BufferOutput = true;
            response.Clear();
            response.ClearHeaders();
            response.ContentEncoding = Encoding.Unicode;
            //file Name
            response.AddHeader("content-disposition", "attachment;filename=" + fname + "_Questions.xls");
            response.ContentType = "application/vnd.ms-excel";
            response.Write(sb.ToString());
            response.End();

            return View();
        }

        public ActionResult ChangeStatus(long id)
        {
            Test tst = en.Tests.Where(x => x.TestID == id).Select(x => x).FirstOrDefault();
            if (tst.Status == "Published")
            {
                tst.Status = "Saved";
            }
            else
            {
                var q = en.Questions.Where(x => x.TestID == id).ToList();
                if (q.Count == 0)
                {
                    TempData["editTest"] = "There are no Questions in this Test. Test can not be published";
                    return RedirectToAction("Index");
                }
                var res = en.TestSections.Where(x => x.TestID == id).Select(x => x);
                foreach (var itm in res) 
                {
                    var e = en.Questions.Where(x => x.SectionID == itm.Section_ID).Select(x => x).ToList();
                    if (e.Count == 0)
                    {
                        TempData["editTest"] = "There are no Questions in Section " + itm.SectionName + ".Test can not be published";
                        return RedirectToAction("Index");
                    }
                }
                tst.Status = "Published";
            }
            en.SaveChanges();
            return RedirectToAction("Index");
        }
    }
}