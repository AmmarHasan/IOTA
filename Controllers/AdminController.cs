using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Data.OleDb;
using System.Data.SqlClient;
using System.Data;
using InteractiveLearning.Models;
namespace InteractiveLearning.Controllers
{
    public class AdminController : BaseController
    {
        //
        // GET: /Admin/
        [Authorize]
        public ActionResult Index()
        {
           AdminModel model = new AdminModel();
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();

            var res = en.Department_NED.Select(x => x).ToList();
            model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");
            var user = en.User_Details.Where(x=>x.UserID == LoggedInUserKey).Select(x=>x).FirstOrDefault();
            model.deptTitle = en.Department_NED.Where(x => x.Dept_Id == user.Dept_Id).Select(x => x.Dept_Name).FirstOrDefault();
            model.dept = (int)user.Dept_Id;
            TempData["fileMessage"] = "null";
            return View(model);
      
          
        }

        [HttpPost]
        public ActionResult Index(AdminModel model)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();

            var res = en.Department_NED.Select(x => x).ToList();
            var user = en.User_Details.Where(x => x.UserID == LoggedInUserKey).Select(x => x).FirstOrDefault();
            model.deptTitle = en.Department_NED.Where(x => x.Dept_Id == user.Dept_Id).Select(x => x.Dept_Name).FirstOrDefault();
           
            model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");
            model.dept = (int)user.Dept_Id;
           
            if (Request.Files["FileUpload1"].ContentLength > 0)
            {
                string extension = System.IO.Path.GetExtension(Request.Files["FileUpload1"].FileName);
                string path1 = string.Format("{0}/{1}", Server.MapPath("~/Content/UploadedFolder"), Request.Files["FileUpload1"].FileName);
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
                    OleDbCommand cmd = new OleDbCommand("Select [Enrolment No],[Roll No],[Student Name] from [" + sheetName + "]", excelConnection);

                    excelConnection.Open();
                    OleDbDataReader dReader;
                    dReader = cmd.ExecuteReader();
                    int count = 0;
                    string enr = "";
                    string sname = "";
                    string rollno = "";
                    int flag = 0;
                    string err = "";
                    while (dReader.Read())
                    {
                        enr = dReader[0].ToString();//Here we are calling the valid method
                        rollno = dReader[1].ToString();
                        sname = dReader[2].ToString();
                        if ((enr != null && enr != "") && (rollno != null && rollno != "") && (sname != null && sname != ""))
                        {
                            try
                            {
                                var ress = en.NED_Student_Data.Where(x => x.EnrollmentNo == enr).Select(x => x).FirstOrDefault();
                                if (ress == null)
                                {
                                    var rec = new NED_Student_Data();
                                    rec.Batch = model.batch;
                                    rec.Std_Name = sname;
                                    rec.Std_RollNo = rollno;
                                    rec.Section = model.section;
                                    rec.EnrollmentNo = enr;
                                    rec.Department = model.dept;
                                    en.AddToNED_Student_Data(rec);
                                    count++;
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

        public ActionResult ViewStudent(string dpt,string batch,string sec)
        {
            var model = new AdminModel();
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();

            var res = en.Department_NED.Select(x => x).ToList();
            model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");

            if (dpt != "" && dpt !=null && batch != "" && batch != null && sec !="")
            {
                model.dept = Convert.ToInt32(dpt.ToString());
                model.batch = batch.ToString();
                model.section = sec.ToString();
                var ress = en.NED_Student_Data.Where(x => x.Batch == model.batch && x.Department == model.dept && x.Section == model.section).Select(x => x).ToList();
                model.sudentlist = ress;
                ViewData["dept"] = en.Department_NED.Where(x => x.Dept_Id == model.dept).Select(x => x.Dept_Name).FirstOrDefault();
                ViewData["batch"] = model.batch;
                ViewData["section"] = model.section;
            
            
            }
            return View(model);
        }
        [HttpPost]
        public ActionResult ViewStudent(AdminModel model)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
            var ress = en.NED_Student_Data.Where(x => x.Batch == model.batch && x.Department == model.dept && x.Section == model.section).Select(x => x).ToList();
            model.sudentlist = ress;
            var res = en.Department_NED.Select(x => x).ToList();
            model.Departments = new SelectList(res, "Dept_Id", "Dept_Name");
            ViewData["dept"] = en.Department_NED.Where(x => x.Dept_Id == model.dept).Select(x => x.Dept_Name).FirstOrDefault();
            ViewData["batch"] = model.batch;
                
            return View(model);
   
        }
       
        [HttpPost]
        public ActionResult DeleteStudent(string id,string dept,string btch,string section)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();
            var ress = en.NED_Student_Data.Where(x => x.EnrollmentNo == id).Select(x => x).FirstOrDefault();

            if(ress !=null)
                try
                {
                    en.DeleteObject(ress);
                    en.SaveChanges();
                }
                catch (Exception ex)
                { 
                }
            return RedirectToAction("ViewStudent", new {dpt = dept,batch = btch,sec = section });

        }


        public ActionResult TeachersData()
        {
         
            TempData["fileMessage"] = "null";
            return View();


        }

        [HttpPost]
        public ActionResult TeachersData(AdminModel model)
        {
            InterActiveLearningDatabaseEntities en = new InterActiveLearningDatabaseEntities();

           
            if (Request.Files["FileUpload1"].ContentLength > 0)
            {
                string extension = System.IO.Path.GetExtension(Request.Files["FileUpload1"].FileName);
                string path1 = string.Format("{0}/{1}", Server.MapPath("~/Content/UploadedFolder"), Request.Files["FileUpload1"].FileName);
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
                    OleDbCommand cmd = new OleDbCommand("Select * from [" + sheetName + "]", excelConnection);

                    excelConnection.Open();
                    OleDbDataReader dReader;
                    dReader = cmd.ExecuteReader();
                    int count = 0;
                    string enr = "";
                    string empname = "";
                    string dept = "";
                    int flag = 0;
                    string err = "";
                    while (dReader.Read())
                    {
                        enr = dReader[1].ToString();//Here we are calling the valid method
                        empname = dReader[2].ToString();
                        dept = dReader[3].ToString();
                        if ((enr != null && enr != "") && (empname != null && empname != ""))
                        {
                            try
                            {
                                int enrr = Convert.ToInt32(enr);
                      
                                var ress = en.NED_Teachers_Data.Where(x => x.Pers_No == enrr).Select(x => x).FirstOrDefault();
                                if (ress == null)
                                {
                                    var rec = new NED_Teachers_Data();
                                    rec.Pers_No = enrr;
                                    rec.Employee_Name = empname;
                                    rec.Department = dept;
                                    en.AddToNED_Teachers_Data(rec);
                                    count++;
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
                            TempData["fileMessage"] = "Record already exists";

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










    }
    }


