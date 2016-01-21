define(['jquery'], function($){
    var CustomWidget = function () {
    	var self = this;

    	var ddnumber;
		var daynum;
		var monthnum;
		var yearnum;
		var zfullname;
		var wdays;
		var zprice;
		var requisite;


		this.callbacks = {
			render: function(){
				//console.log('render'); test 7zip

				var template = '<div><h1>Создать задачи</h1>'+
                    '<button class="button-input" id="createtaskfromlead">Создать задачи в AMO</button>'+
                    '<div id="send_result"></div>'+
                    '</div>';

                self.render_template({
                    caption:{
                        class_name:'js-ac-caption',
                        html:''
                    },
                    body:'',
                    render :  template
                });

				return true;
			},
			init: function(){

				return true;
			},
			bind_actions: function(){
				$('#createtaskfromlead').on('click', function(){

					self.callbacks.getData();
					console.log('Start-OnClick-createtaskfromlead');
					//console.log('OnClick-Send-Post data ddnumber -'+self.ddnumber+":");
					//task_type = 1 - follow up
					//var date = new  Date(2015, 11, 25, 23, 59, 59); //всегда помним что в JS месяцев с 0 по 11 иначе уносит в будущее:)

					//var vardata = "";
					console.log('Start-OnClick-createtaskfromlead - readyto send post');
					//=====производственный календарь==========================================
					//обращение через crm_post за json для календаря
					var jsonstr = "";
					var norefresh = false;
					self.crm_post (
						'http://basicdata.ru/api/json/calend/',
						{
							request:1
						},
						function(msg) {
							//console.log('res basicdata:'+JSON.stringify(msg));
							jsonstr = JSON.stringify(msg);
							if (jsonstr=="") {
								alert('Обработка остановлена! Причина:Не удалось получить производственный календарь с basicdata.ru');
								norefresh = true;
								return;
							}
							//=====получаем стартовую дату (поле дата начала обучения CFV[685758])=====
							datestr = self.startdogdate; //возвращает строку вида 01.12.2015
							if (datestr=="") {
								alert('Обработка остановлена! Причина:Не удалось получить дату из сделки.');
								norefresh = true;
								return;
							}
							//получаем из строки дату
							arrstr = datestr.split('.');
							datestr = ""+arrstr[2]+"-"+arrstr[1]+"-"+arrstr[0]; //формируем строчку вида 2015-12-25
							var today = new Date(datestr);
							//var today = new Date();
							//=====получаем число дней по договору (поле CFV[813354])==================
							n = self.wdays;
							console.log( "task  = !" + n+"!");
							tmpstr = ""+n;
							if ((tmpstr=="") || (n==="undefined") ) {
								alert('Обработка остановлена! Причина:Не удалось получить данные о числе дней договора из сделки.');
								norefresh = true;
								return;
							}
							//id холупцевой 622977
							ruserid = 622977;
							//id сделки self.leadid
							tasks1 = "";
							//tasks1 = [];
							//=====забег в цикле по числу рабочих дней ================================
							if (typeof(self.leadid) == "undefined") {
								alert('Обработка остановлена! Причина:Не удалось получить данные об идентификаторе сделки.');
							} else {
								strtmp123 = self.zfullname;
								if (typeof(self.zfullname) == "undefined"||(strtmp123==="")) {
									alert('Обработка остановлена! Причина:Нет данных контакта.');
								} else {
									for (i24 = 0; i24 < n; i24++) {
									//for (i25 = 0; i25 < 10000; i25++) {
										//doing pause
									//	i26 = ""+i25;
									//}
										varr = self.callbacks.checkdate2812(today,jsonstr);
										if (varr==true) {
											//создаем задачу
											console.log( 'task date:'+ i24 + " = " + today);
											var tilltime = today.getTime()/1000;
											tilltime = tilltime - 10800-1; //отнимаем 3 часа чтобы поместить задачу в наш часовой пояс и 1 секунду чтобы время было 23:59
											//=====рабочий код - закомментирован чтобы не создавать лишних сущностей										
										
											tasks1 = tasks1 + '{"element_id":'+self.leadid+',"element_type":2,"task_type":1,"text":"'+ strtmp123+'","responsible_user_id":'+ruserid+',"complete_till":'+ tilltime+'},';

											//=====рабочий код - закомментирован чтобы не создавать лишних сущностей
											//ставим новую дату
											today.setDate(today.getDate() + 1);
										} else {
											//дата занята - получаем слудующую свободную
											today = self.callbacks.getnext2812(today,jsonstr);
											//создаем задачу
											var tilltime = today.getTime()/1000;
											tilltime = tilltime - 10800-1;
											console.log( 'task date:'+ i24 + " = " + today);
											//=====рабочий код - закомментирован чтобы не создавать лишних сущностей
										
											tasks1 = tasks1 + '{"element_id":'+self.leadid+',"element_type":2,"task_type":1,"text":"'+ strtmp123+'","responsible_user_id":'+ruserid+',"complete_till":'+ tilltime+'},';
											//=====рабочий код - закомментирован чтобы не создавать лишних сущностей
											//ставим новую дату
											today.setDate(today.getDate() + 1);
										}
	
									} //end for
									//обрезаем у строки последнюю запятую

									intleng = tasks1.length - 1;
									tasks1 = tasks1.substring(0,intleng);
									tasks1 = '{"request":{"tasks":{"add":['+tasks1+']}}}';
									console.log("Start POST new1:" + tasks1);
									jobj = JSON.parse(tasks1);
									console.log("Start POST new2");
									strjdon12 = "" + JSON.stringify(jobj);
									console.log("Start POST new3:" + strjdon12);
									//создание сделок пачкой
									$.post(
										"https://calgelacademy.amocrm.ru/private/api/v2/json/tasks/set",
										jobj,
										function( data ) {
											console.log( 'Res:'+JSON.stringify(data) );
										},
										"json"
									);
		
									//обновляем окно
									setTimeout(function() {window.location.reload();}, 1000); //обновим страничку через 1 сек
								}
							}
						},
						'json'
					);
					console.log('Finish-OnClick-createtaskfromlead');

				});

				//console.log(self.system().area);


				return true;
			},
			settings: function(){

				return true;
			},
			onSave: function(){

				return true;
			},
			destroy: function(){

			},
			contacts: {
					//select contacts in list and clicked on widget name
					selected: function(){

					}
				},
			leads: {
					//select leads in list and clicked on widget name
					selected: function(){

					}
				},
			tasks: {
					//select taks in list and clicked on widget name
					selected: function(){

					}
				},
			getData: function(){
					console.log('StartGetData');
					self.ddnumber = $('input[name="CFV[813270]"]').val();
					var today = new Date();
					self.daynum = "" + today.getDate();
					self.monthnum = "" + (today.getMonth()+1); //January is 0!
					self.yearnum = "" + today.getFullYear();
					self.startdogdate = $('input[name="CFV[685758]"]').val(); //дата начала обучения
					
					self.leadid = $('input[name="lead_id"]').val(); //id сделки lead_id
					
					self.zfullname = $('input[name="contact[NAME]"]').val();
					tmpwdays = $('input[name="CFV[813354]"]').val();
					if (tmpwdays=='1948330') {
						self.wdays = 2;
						self.zprice = 7800;
					} else if (tmpwdays=='1948332') {
						self.wdays = 10;
						self.zprice = 25800;
					} else if (tmpwdays=='1948334') {
						self.wdays = 21;
						self.zprice = 45800;
					} else {

					}
					self.requisite = $('textarea[name="CFV[813368]"]').val();
					console.log('FinishGetData');
			},
			updateTextarea: function(txt, msg){
				console.log('UpdateTextArea');
				$('#send_result').html("");
				var restxt =txt+" ";
				restxt = restxt+" : ";
				restxt = restxt+msg.dl_link;
				$('.note-edit__body > textarea').trigger('focusin').val(restxt);
				$('.note-edit__actions__submit').removeClass('button-input-disabled').trigger('click');
			},
			updateLink: function(msg){
				console.log('UpdateLink v1:');
				$('#send_result').html("");
				var restxt = "" + msg.dl_link;
				console.log('UpdateLink v2:' + restxt);
				$('input[name="CFV[813398]"]').val(restxt);
			},
			checkdate2812: function(dat1,jsonstr) {
				//console.log( 'checkdate2812  dat1: ' + dat1 + ' json: '+jsonstr);
				var mnum1 = "" + (dat1.getMonth()+1);
				var ynum1 = "" + dat1.getFullYear();
				//console.log( 'checkdatestart mnum: ' + mnum1 + ' ynum: ' + ynum1);
				obj = $.parseJSON( jsonstr );
				//console.log( 'checkdatefor1:'+JSON.stringify(obj.data["2003"]["1"]));
				sourcestr1 = JSON.stringify(obj.data[ynum1][mnum1]);
				searchstr1 = '"'+ dat1.getDate() + '":{"isWorking":2}';
				if(sourcestr1.indexOf(searchstr1)>=0) {
					return false;
					//console.log( 'dat1 - выходной');
				} else {
					//return true;
					//console.log( 'dat1 - рабочий день');
					if ((dat1.getDay()==0) || (dat1.getDay()==6)) {
						//это вокресенье или суббота
						return false;
						//console.log( 'dat1 - рабочий день');
					} else {
						return true;
						//console.log( 'dat1 - рабочий день');
					}
				}
				//console.log( 'checkdate2812  finish');
			},
			getnext2812: function(dat2,jsonstr) {
				//console.log( 'getnext2812:'+ dat2.getDay()); //sunday = 0
				dat2.setDate(dat2.getDate() + 1);
				var mnum2 = "" + (dat2.getMonth()+1);
				var ynum2 = "" + dat2.getFullYear();

				obj2 = $.parseJSON( jsonstr );
				//console.log( 'checkdatefor1:'+JSON.stringify(obj2.data["2003"]["1"]));
				sourcestr2 = JSON.stringify(obj2.data[ynum2][mnum2]);
				searchstr2 = '"'+dat2.getDate()+'":{"isWorking":2}';
				if(sourcestr2.indexOf(searchstr2)>=0) {
					newdat = self.callbacks.getnext2812(dat2,jsonstr);
					return newdat;
					//console.log( 'dat2 - выходной');
				} else {
					if ((dat2.getDay()==0) || (dat2.getDay()==6)) {
						//это вокресенье или суббота
						newdat = self.callbacks.getnext2812(dat2,jsonstr);
						return newdat;
						//console.log( 'dat2 - рабочий день');
					} else {
						return dat2;
						//console.log( 'dat2 - рабочий день');
					}
				}

			}
		};
		return this;
    };


return CustomWidget;
});