using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Web.Mvc;
using System.Web.Security;

namespace InteractiveLearning.Models
{

   
    public class AdminModel
    {
         [Display(Name = "Discipline")]

         public int dept { get; set; }
         [Display(Name = "Discipline")]

        public SelectList Departments { get; set; }
        [Display(Name = "Batch")]

        public string batch { get; set; }
        [Display(Name = "Discipline")]

        public string deptTitle { get; set; }
        [Display(Name = "Section")]

        public string section { get; set; }

        public IList<NED_Student_Data> sudentlist { get; set; }
    }
}
