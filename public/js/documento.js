const url_prev = location.origin + '/desarrollo/public';

// In your Javascript (external .js resource or <script> tag)

function listProductos(){


  }
$(document).ready(function () {
	$('.js-example-basic-single').select2();

	// se obtienen los productos
	$.ajax({
		type: "POST",
		url: url_prev + '/listProductos',
		data: {
			_token: $('input[name="_token"]').val()
		} //esto es necesario, por la validacion de seguridad de laravel
	}).done(function (msg) {		
			var productos = msg;
			var counter = 2;

			$("#addButton").click(function () {

				if (counter > 20) {
					alert("Only 10 textboxes allow");
					return false;
				}

				var opciones = "";				
					for(var i=0; i<productos.length; i++){
						opciones =opciones+'<option id="'+productos[i].id_producto+'" nombre_producto="'+productos[i].nombre_producto+'" tipo_cambio="'+productos[i].tipo_cambio+'" valor_producto="'+productos[i].valor_producto+'">'+productos[i].nombre_producto+' ('+productos[i].tipo_cambio+' '+productos[i].valor_producto+')'+'</option>';
					}


				var newTextBoxDiv = $(document.createElement('div'))
					.attr("id", 'TextBoxDiv' + counter)
					.attr("style", 'border-top: 1px solid; margin-bottom: 20px;'+
					'border: 1px solid;'+
					'border-color: #dee2e6;'+
					'background-color: #e0e4ff;'+
					' padding: 12px; padding-top: 0px;');

				newTextBoxDiv.after().html('<label class="top-spaced">Seleccione producto N° ' + counter + ' : </label>'+
				'<select id="select_producto_'+counter+'" class="form-control">'+
					'<option id="0">Elija Uno</option>'
					+opciones+
				'</select>'+
				'<label class="top-spaced">Unidades producto N° '+counter+'</label>'+
				'<input class="form-control" id="unidades_producto_'+counter+'""></input>'+
				'<label class="top-spaced">Descuento para producto N° '+counter+' (opcional)</label>'+
				'<input class="form-control" id="descuento_producto_'+counter+'""></input>');
				$("#cantidad_divs").attr("cantidad",counter);		
				newTextBoxDiv.appendTo("#TextBoxesGroup");
				counter++;
			});

			$("#removeButton").click(function () {
				if (counter == 1) {
					alert("No more textbox to remove");
					return false;
				}

				counter--;
				$("#cantidad_divs").attr("cantidad",(counter-1));
				$("#TextBoxDiv" + counter).remove();

			});
		}).fail(function () {
			console.log("error en generacion dinamica de productos ");		
		});

});




function guardarPropuesta() {
	const elemento = document.getElementById('propuesta_detalle');
	
	var folio = $("#folio_propuesta").text();
	html2pdf()
		.set({
			margin: 1,
			filename: folio+'.pdf',
			image: {
				type: 'png',
				quality: 0.98
			},
			html2canvas: {
				scale: 1, // a mayor escala, mejores graficos pero mas peso
			},
			jsPDF: {
				unit: "in",
				format: "a3",
				orientation: 'portrait' //landscape de forma horizontal
			}
		})
		.from(elemento)
		.save()
		.catch(err => console.log(err))
		.finally()
		.outputPdf()
		.then(function (pdf) {
			// This logs the right base64
			$("#modalCargando").modal("hide");
			var bpdf = btoa(pdf);

			$.ajax({
				type: "POST",
				url: url_prev + '/guardarPDF',
				data: {
					pdf: bpdf,
					nombre_doc: folio+'.pdf',
					_token: $('input[name="_token"]').val()
				} //esto es necesario, por la validacion de seguridad de laravel
			}).done(function (msg) {
				guardarEnBD();
				$("#guardar_propuesta").hide();
			}).fail(function () {				
				console.log("Error en descarga del documento");
			});


			$("#hidden_pdf").attr("pdf_64", bpdf);
		});
}


function vistaPreviaPDF() {

	var tipo_documento = $("#tipo_documento option:selected").attr('id');
	var id_cliente = $("#select_cliente option:selected").attr('id');
	$.ajax({
		type: "POST",
		url: url_prev + '/propuestaLastId',
		data: {
			_token: $('input[name="_token"]').val()
		} //esto es necesario, por la validacion de seguridad de laravel
	}).done(function (msg) {
		
		var folio_propuesta = "PC"+id_cliente+"_"+(parseInt(msg[0].numero_folio)+1);
		$("#folio_propuesta").text(folio_propuesta);
	}).fail(function () {				
		console.log("Error en propuestaLastId");
	});


	var id_producto = $("#select_producto option:selected").attr('id');
	var unidades = $("#unidades");
	//indica la cantidad de productos que se ingresaron en el formulario anterior
	var cantidad_divs = $("#cantidad_divs").attr("cantidad");

	// se obtienen los datos del cliente

	$("#nombre_cliente").text($("#select_cliente option:selected").attr("nombre_cliente"));
	$("#email_cliente").text($("#select_cliente option:selected").attr("email_cliente"));
	$("#fono_cliente").text($("#select_cliente option:selected").attr("fono_cliente"));
	$("#contacto_nombre").text($("#select_cliente option:selected").attr("contacto_nombre"));
	$("#contacto_cargo").text($("#select_cliente option:selected").attr("contacto_cargo"));
    $("#id_cliente").text(id_cliente);

	//se obtienen los productos dinamicos del formulario anterior
	// cantidad
	// nombre
	// precio unitario
	// precio total
	var total_parcial = 0;
	var subtotal = 0;
	var iva = 0;
	var total = 0;
	var tipo_cambio_p = 0;
	for(var i=1; i<=cantidad_divs;i++){
		total_parcial = parseInt($("#select_producto_"+i+" option:selected").attr("valor_producto"))*parseInt($("#unidades_producto_"+i).val());
		tipo_cambio_p = $("#select_producto_"+i+" option:selected").attr("tipo_cambio").toUpperCase();
		$("#tabla_propuesta_body").append('<tr>'+
			'<td>'+$("#unidades_producto_"+i).val()+'</td>'+
			'<td>'+$("#select_producto_"+i+" option:selected").attr("nombre_producto")+'</td>'+
			'<td><b>'+tipo_cambio_p+' </b> '+$("#select_producto_"+i+" option:selected").attr("valor_producto")+'</td>'+
			'<td><b>'+tipo_cambio_p+'</b> '+total_parcial+'</td>'+
		'</tr>')
		;
		subtotal = subtotal + total_parcial;
	}

	iva= Math.round(subtotal*0.19);
	total = subtotal + iva;
	
	$("#subtotal").text(tipo_cambio_p+' '+subtotal);
	$("#iva").text(iva);
	$("#total_con_iva").text(tipo_cambio_p+' '+total);

	setTimeout(() => {
		$("#datos_ingreso").hide();
	}, 200);

	setTimeout(() => {
		$("#plantilla_documento").show();
	}, 200);
}


function editarPDF() {
	$("#guardar_propuesta").show();
	$("#enviar_propuesta").hide();
	setTimeout(() => {
		$("#tabla_propuesta_body").html("");
		$("#plantilla_documento").hide();
	}, 200);

	setTimeout(() => {
		$("#datos_ingreso").show();
	}, 200);
}

function eliminarProducto() {
	var id_producto = $("#modal_eliminar").attr("id_producto");
	$("#modal_eliminar").modal('hide');
	$("#modalCargando").modal('show');
}

function enviarPropuesta() {
	$("#modalCargando").modal('show');
	enviarCorreo();			    
}

function enviarCorreo(){
		// envio de propuesta
		var folio = $("#folio_propuesta").text();
		var destinatario = $("#email_cliente").text();
		$.ajax({
		  type: "POST",
		  url: url_prev + '/enviarPropuesta',
		  data: {
			destinatario: destinatario,
			nombre_doc: folio+'.pdf',
			_token: $('input[name="_token"]').val()
		  } //esto es necesario, por la validacion de seguridad de laravel
		}).done(function (msg) {		  	
			$("#modalCargando").modal('hide');
			setTimeout(() => {
				$("#modalExitoso").modal("show");						
			}, 300);		  
			
		}).fail(function () {
		  console.log("error en funcion enviarPropuesta");
		});					
}

function guardarEnBD(){
	// se almacena la propuesta en base de datos
	var folio = $("#folio_propuesta").text();
	var cantidad_divs = $("#cantidad_divs").attr("cantidad");
	var nombre_cliente = $("#nombre_cliente").text();
	var email_destino =$("#email_cliente").text();
	var id_ejecutivo = $("#id_usuario").text();
	var id_cliente = $("#id_cliente").text();		
	
	var array_tipo_cambio = [];
	var array_id_producto = [];
	var array_nombre_producto = [];
	var array_unidades = [];
	var array_valor_unitario_producto =[];
	var array_subtotal_producto = [];
	var total_con_iva = parseInt($("#total_con_iva").text().substr(3).trim());
	var iva = 0.19;
	var subtotal = 0;

	  for(var i=1;i<=cantidad_divs;i++){
		subtotal = parseInt($("#select_producto_"+i+" option:selected").attr("valor_producto"))*parseInt($("#unidades_producto_"+i).val());				
		array_tipo_cambio.push($("#select_producto_"+i+" option:selected").attr("tipo_cambio").toUpperCase());
		array_id_producto.push($("#select_producto_"+i+" option:selected").attr("id"));
		array_nombre_producto.push($("#select_producto_"+i+" option:selected").attr("nombre_producto"));
		array_valor_unitario_producto.push($("#select_producto_"+i+" option:selected").attr("valor_producto"));
		array_unidades.push($("#unidades_producto_"+i).val());
		array_subtotal_producto.push(subtotal);
	}			

	var json_tipo_cambio = JSON.stringify(array_tipo_cambio);
	var json_id_producto = JSON.stringify(array_id_producto);
	var json_nombre_producto = JSON.stringify(array_nombre_producto);
	var json_unidades = JSON.stringify(array_unidades);
	var json_valor_unitario_producto = JSON.stringify(array_valor_unitario_producto);
	var json_subtotal_producto = JSON.stringify(array_subtotal_producto);
	var total_s_iva = parseInt($("#subtotal").text().substr(3).trim());

	var id_ejecutivo = $("#id_usuario").text();
	var id_cliente = $("#select_cliente option:selected").attr("id");
	var email_cliente = $("#select_cliente option:selected").attr("email_cliente");
	var fono_cliente =  $("#select_cliente option:selected").attr("fono_cliente");
	var nombre_cliente = $("#select_cliente option:selected").attr("nombre_cliente");

	
	var datos_envio = [
		json_tipo_cambio,
		json_id_producto,
		json_nombre_producto,
		json_unidades,
		json_valor_unitario_producto,
		json_subtotal_producto,
		total_s_iva,
		total_con_iva,
		Math.round(total_s_iva*iva),
		id_ejecutivo,
		id_cliente,
		email_cliente,
		fono_cliente,
		nombre_cliente,
		folio
	];

	$("#modalCargando").modal('hide');
	$.ajax({
		type: "POST",
		url: url_prev + '/setPropuesta',
		data: {
		  datos_envio: datos_envio,
		  _token: $('input[name="_token"]').val()
		} //esto es necesario, por la validacion de seguridad de laravel
		  }).done(function (msg) {
			$("#enviar_propuesta").show();
		}).fail(function () {
		console.log("error en funcion enviarPropuesta");
		});
	//queda pendiente almacenar en la base de datos
}


function crearClienteDocumento(){
	$("#modalCrearCliente").modal("show");
}

function cargarRegiones() {
	$.ajax({
	  type: "GET",
	  url: '/obtenerRegiones',
	  data: {}
	}).done(function(msg) {});
  }
  
  $('region').on('change', function() {
	limpiarSeleccion();
  });
  
  function limpiarSeleccion() {
	var opcion = "<option id='0'> Elija Una </option>";
	$('#provincia').find('option').remove().end().append(opcion);
	$('#comuna').find('option').remove().end().append(opcion);
  }
  
  
  function getProvinciasRegion() {
	var idRegion = parseInt($("#region").val());
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token]').attr('content')
	  }
	});
	$.ajax({
	  type: "POST",
	  url: url_prev + '/obtenerProvincias',
	  data: {
		id: idRegion,
		_token: $('input[name="_token"]').val()
	  } //esto es necesario, por la validacion de seguridad de laravel
	}).done(function(msg) {
	  // se incorporan las opciones en la provincia
	  var json = JSON.parse(msg);
	  var opciones = "<option id='0'> Elija Una </option>";
	  for (var i = 0; i < json.length; i++) {
		opciones = opciones + "<option id='" + json[i].id + "' id_provincia='" + json[i].id + "'>" + json[i].provincia + "</option>";
	  }
	  $('#provincia').find('option').remove().end().append(opciones);
	});
  }
  
  function getComunasProvincia() {
	var idProvincia = $("#provincia option:selected").attr('id_provincia');
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token]').attr('content')
	  }
	});
	$.ajax({
	  type: "POST",
	  url: url_prev + '/obtenerComunas',
	  data: {
		id: idProvincia,
		_token: $('input[name="_token"]').val()
	  } //esto es necesario, por la validacion de seguridad de laravel
	}).done(function(msg) {
	  // se incorporan las opciones en la comuna
	  var json = JSON.parse(msg);
	  var opciones = "<option id='0'> Elija Una </option>";
	  for (var i = 0; i < json.length; i++) {
		opciones = opciones + "<option id=" + json[i].id + " id_comuna= '" + json[i].id + "'>" + json[i].comuna + "</option>";
	  }
	  $('#comuna').find('option').remove().end().append(opciones);
	});
  }

  function crearProductoDocumento(){
	$("#modalCrearProducto").modal("show");
  }

  function crearCliente() {
	var nombre = $("#nombre").val();
	var rut = $("#rut").val();
	var fono = parseInt($("#telefono").val());
	var email = $("#email").val();
	var idRegion = parseInt($("#region").val());
	var idProvincia = parseInt($("#provincia option:selected").attr('id_provincia'));
	var idComuna = parseInt($("#comuna option:selected").attr('id_comuna'));
	var direccion = $("#direccion").val();
	var nombre_contacto = $("#nombre_contacto").val();
	var cargo_contacto = $("#cargo_contacto").val();
	var array_datos = [];
	var token = $('input[name="_token"]').val();
  
	array_datos.push({
	  nombre: nombre,
	  rut: rut,
	  fono: fono,
	  email: email,
	  id_region: idRegion,
	  id_provincia: idProvincia,
	  id_comuna: idComuna,
	  direccion: direccion,
	  nombre_contacto: nombre_contacto,
	  cargo_contacto : cargo_contacto
	});
  
	var json_datos = JSON.stringify(array_datos);
  
	$.ajaxSetup({
	  headers: {
		'X-CSRF-TOKEN': $('meta[name="csrf-token]').attr('content')
	  }
	});
  
	$.ajax({
	  type: "POST",
	  url: url_prev + '/crearCliente',
	  data: {
		json_datos: json_datos,
		_token: token
	  } //esto es necesario, por la validacion de seguridad de laravel
	}).done(function(msg) {
		$("#modalCrearCliente").modal("hide");
		setTimeout(() => {
			$("#modalExitosa").modal('show');	
		}, 200);
		
	  
	}).fail(function() {
		$("#modalCrearCliente").modal("hide");
	  setTimeout(() => {  
		  $("#modalError").modal('show');
	  }, 200);
	});
  }

  function crearProducto(){
    $.ajaxSetup({
      headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token]').attr('content')
      }
    });

    var clase = $("#tipo_producto option:selected").attr('id');
    var nombre_producto = $("#nombre_producto").val();
    var valor_producto = $("#valor_venta").val();
    var descripcion_producto = $("#descripcion_producto").val();
    var tipo_cambio = $("#select_cambio option:selected").attr("id");
    var stock = $("#stock").val();
    var costo = $("#costo").val();
    var margen = $("#margen").val();
    var numero_interno = $("#numero_interno").val();
    var numero_fabricacion = $("#numero_fabricacion").val();
    var array_datos = [];
    var token = $('input[name="_token"]').val();
    array_datos.push({
      clase: clase,
      nombre_producto: nombre_producto,
      valor_producto: valor_producto,
      descripcion_producto: descripcion_producto,
      tipo_cambio: tipo_cambio,
      stock: stock,
      costo: costo,
      margen: margen,
      numero_interno: numero_interno,
      numero_fabricacion: numero_fabricacion
    });
  
    var json_datos = JSON.stringify(array_datos);

    $("#modalCargando").modal('show');
    $.ajax({
        type: "POST",
        url: url_prev + '/crearProducto',
        data: {
        json_datos: json_datos,
        _token: token
        } //esto es necesario, por la validacion de seguridad de laravel
    }).done(function(msg) {
		$("#modalCrearProducto").modal('hide');
        setTimeout(() => {  
            $("#modalCargando").modal('hide'); 
        }, 500);
        setTimeout(() => {  
            $("#modalExitosa").modal('show');
        }, 500);
     
    }).fail(function() {
        
        setTimeout(() => {  
            $("#modalCargando").modal('hide'); 
        }, 500);
        setTimeout(() => {  
            $("#modalError").modal('show');
        }, 500);
    });
  }