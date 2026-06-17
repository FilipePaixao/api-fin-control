import { EErrorCode } from '../../domain/common/errors/enums/EErrorCode';
import { Catalog } from '@sauvvitech/st-packages';

export const ErrorCatalog: Catalog<EErrorCode> = {
  [EErrorCode.DATABASE_ERROR]: {
    'pt-BR': 'Erro ao acessar o banco de dados. Por favor, tente novamente.',
    en: 'Database error. Please try again.',
    es: 'Error al acceder a la base de datos. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.RESOURCE_CONFLICT]: {
    'pt-BR': 'Conflito: o recurso já existe ou está em uso.',
    en: 'Conflict: the resource already exists or is in use.',
    es: 'Conflicto: el recurso ya existe o está en uso.',
  },
  [EErrorCode.RESOURCE_NOT_FOUND]: {
    'pt-BR': 'Recurso não encontrado.',
    en: 'Resource not found.',
    es: 'Recurso no encontrado.',
  },
  [EErrorCode.MAPS_ERROR]: {
    'pt-BR':
      'Erro ao acessar o serviço de mapas. Por favor, tente novamente mais tarde.',
    en: 'Error accessing the maps service. Please try again later.',
    es: 'Error al acceder al servicio de mapas. Por favor, inténtelo de nuevo más tarde.',
  },
  [EErrorCode.AUTH_INVALID_CREDENTIALS]: {
    'pt-BR': 'Usuário ou senha inválidos.',
    en: 'Invalid username or password.',
    es: 'Usuario o contraseña inválidos.',
  },
  [EErrorCode.AUTH_TOKEN_EXPIRED]: {
    'pt-BR': 'Token de acesso expirado. Faça login novamente.',
    en: 'Access token expired. Please log in again.',
    es: 'Token de acceso expirado. Inicie sesión nuevamente.',
  },
  [EErrorCode.AUTH_TOKEN_REVOKED]: {
    'pt-BR': 'Sessão revogada. Faça login novamente.',
    en: 'Session revoked. Please log in again.',
    es: 'Sesión revocada. Inicie sesión nuevamente.',
  },
  [EErrorCode.AUTH_UNAUTHORIZED]: {
    'pt-BR': 'Não autorizado. Token inválido ou ausente.',
    en: 'Unauthorized. Invalid or missing token.',
    es: 'No autorizado. Token inválido o ausente.',
  },
  [EErrorCode.AGENT_LLM_UNAVAILABLE]: {
    'pt-BR':
      'Assistente de IA indisponível. Verifique se o Ollama está em execução.',
    en: 'AI assistant unavailable. Please ensure Ollama is running.',
    es: 'Asistente de IA no disponible. Verifique que Ollama esté en ejecución.',
  },
  [EErrorCode.SERVICE_USER_UNKNOWN]: {
    'pt-BR': 'Usuário não encontrado. Verifique se os dados estão corretos.',
    en: 'User not found. Please check that the data is correct.',
    es: 'Usuario no encontrado. Verifique que los datos sean correctos.',
  },
  [EErrorCode.PAYMENT_INSUFFICIENT_FUNDS]: {
    'pt-BR':
      'Não foi possível realizar um novo agendamento. Por favor, realize o pagamento de consultas já realizadas.',
    en: 'Insufficient balance. Please add funds to your account to continue.',
    es: 'Saldo insuficiente. Por favor, agregue fondos a su cuenta para continuar.',
  },
  [EErrorCode.INVALID_PAGE_SIZE]: {
    'pt-BR': 'Tamanho de página inválido. O valor deve estar entre 0 e 99.',
    en: 'Invalid page size. The value must be between 0 and 99.',
    es: 'Tamaño de página no válido. El valor debe estar entre 0 y 99.',
  },
  [EErrorCode.CANNOT_DISMISS_WARNING]: {
    'pt-BR': 'O aviso só pode ser ocultado após a aprovação do cadastro.',
    en: 'The warning can only be dismissed after the registration is approved.',
    es: 'El aviso solo se puede ocultar después de que se apruebe el registro.',
  },
  [EErrorCode.PROOF_OF_RESIDENCE_ADDRESS_MISSING]: {
    'pt-BR':
      'Endereço ausente. Para validar o comprovante, por favor, insira seu endereço completo.',
    en: 'Address missing. To validate the proof of residence, please enter your full address.',
    es: 'Dirección ausente. Para validar el comprobante de domicilio, por favor, ingrese su dirección completa.',
  },
  [EErrorCode.WAITING_REVIEW_DATA_INCOMPLETE]: {
    'pt-BR':
      'Dados incompletos. Para enviar para análise, por favor, preencha todos os campos e envie os documentos solicitados.',
    en: 'Incomplete data. To submit for review, please fill in all fields and upload the requested documents.',
    es: 'Datos incompletos. Para enviar a revisión, por favor, complete todos los campos y suba los documentos solicitados.',
  },
  [EErrorCode.UNDER_REVIEW_REQUIRES_WAITING_REVIEW]: {
    'pt-BR':
      "Não é possível iniciar a análise. O status do cadastro precisa ser 'Aguardando Análise'.",
    en: "Cannot start review. The registration status must be 'Waiting for Review'.",
    es: "No se puede iniciar la revisión. El estado del registro debe ser 'Esperando Revisión'.",
  },
  [EErrorCode.ADVANCE_STAGE_MISSING_FIELDS]: {
    'pt-BR': 'Para avançar de etapa, forneça todos os campos obrigatórios.',
    en: 'To advance to the next stage, please provide all required fields.',
    es: 'Para avanzar a la siguiente etapa, proporcione todos los campos obligatorios.',
  },
  [EErrorCode.STATUS_REQUIRES_FIELDS]: {
    'pt-BR': 'Por favor, preencha todos os campos obrigatórios.',
    en: 'Please fill in all mandatory fields.',
    es: 'Por favor, complete todos los campos obligatorios.',
  },
  [EErrorCode.STATUS_REQUIRES_PROOF_ADDRESS]: {
    'pt-BR':
      'O envio do endereço é obrigatório para validar o comprovante de residência.',
    en: 'Submitting the address is required to validate the proof of residence.',
    es: 'Es obligatorio enviar la dirección para validar el comprobante de domicilio.',
  },
  [EErrorCode.STATUS_REQUIRES_PROOF_FILE]: {
    'pt-BR':
      'Não foi possível processar o arquivo do comprovante de residência. Tente novamente.',
    en: 'Could not process the proof of residence file. Please try again.',
    es: 'No se pudo procesar el archivo del comprobante de domicilio. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.REJECTION_REASON_REQUIRED]: {
    'pt-BR': 'O motivo da rejeição é obrigatório ao rejeitar uma validação.',
    en: 'The reason for rejection is required when rejecting a validation.',
    es: 'El motivo del rechazo es obligatorio al rechazar una validación.',
  },
  [EErrorCode.REJECTION_REASON_DESC_TOO_SHORT]: {
    'pt-BR': 'A descrição da rejeição deve ter pelo menos 5 caracteres.',
    en: 'The rejection description must be at least 5 characters long.',
    es: 'La descripción del rechazo debe tener al menos 5 caracteres.',
  },
  [EErrorCode.REJECTION_REASON_NOT_ALLOWED]: {
    'pt-BR':
      "O motivo da rejeição só pode ser adicionado quando o status é 'Rejeitado'.",
    en: "A rejection reason can only be added when the status is 'Rejected'.",
    es: "Un motivo de rechazo solo se puede agregar cuando el estado es 'Rechazado'.",
  },
  [EErrorCode.USER_UNDERAGE]: {
    'pt-BR': 'Para se cadastrar, é preciso ter pelo menos 18 anos.',
    en: 'You must be at least 18 years old to register.',
    es: 'Debes tener al menos 18 años para registrarte.',
  },
  [EErrorCode.NATIONAL_ID_INVALID_LENGTH]: {
    'pt-BR': 'O número do documento deve conter exatamente 11 dígitos.',
    en: 'The document number must contain exactly 11 digits.',
    es: 'El número de documento debe contener exactamente 11 dígitos.',
  },
  [EErrorCode.NATIONAL_ID_INVALID]: {
    'pt-BR': 'O número do documento informado é inválido.',
    en: 'The document number provided is invalid.',
    es: 'El número de documento proporcionado no es válido.',
  },
  [EErrorCode.ADDRESS_INVALID_ZIP_CODE]: {
    'pt-BR': 'CEP inválido. Por favor, insira um CEP com 8 dígitos.',
    en: 'Invalid zip code. Please enter an 8-digit zip code.',
    es: 'Código postal no válido. Por favor, ingrese un código postal de 8 dígitos.',
  },
  [EErrorCode.ADDRESS_INVALID_NUMBER]: {
    'pt-BR': 'Número de endereço inválido. Por favor, insira um número válido.',
    en: 'Invalid address number. Please enter a valid number.',
    es: 'Número de dirección no válido. Por favor, ingrese un número válido.',
  },
  [EErrorCode.ADDRESS_INVALID_STATE]: {
    'pt-BR':
      "Estado inválido. Por favor, use a sigla com duas letras (ex: 'SP', 'RJ').",
    en: "Invalid state. Please use the two-letter abbreviation (e.g., 'NY', 'CA').",
    es: "Estado no válido. Por favor, use la abreviatura de dos letras (ej: 'JAL', 'BCS').",
  },
  [EErrorCode.USER_CREATE_FAILED]: {
    'pt-BR': 'Falha ao criar usuário. Por favor, tente novamente.',
    en: 'Failed to create user. Please try again.',
    es: 'Error al crear el usuario. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.USER_DISMISS_WARNING_FAILED]: {
    'pt-BR': 'Falha ao ocultar o aviso. Por favor, tente novamente.',
    en: 'Failed to dismiss the warning. Please try again.',
    es: 'Error al descartar el aviso. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.USER_RESET_FAILED]: {
    'pt-BR':
      'Falha ao redefinir os dados do usuário. Por favor, tente novamente.',
    en: 'Failed to reset user data. Please try again.',
    es: 'Error al restablecer los datos del usuario. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.USER_UPDATE_FAILED]: {
    'pt-BR': 'Falha ao atualizar os dados. Por favor, tente novamente.',
    en: 'Failed to update data. Please try again.',
    es: 'Error al actualizar los datos. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.USER_DELETE_FAILED]: {
    'pt-BR': 'Falha ao excluir o usuário. Por favor, tente novamente.',
    en: 'Failed to delete user. Please try again.',
    es: 'Error al eliminar el usuario. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.USER_FIND_FAILED]: {
    'pt-BR': 'Falha ao buscar o usuário. Por favor, tente novamente.',
    en: 'Failed to find user. Please try again.',
    es: 'Error al buscar el usuario. Por favor, inténtelo de nuevo.',
  },
  [EErrorCode.COGNITO_USER_NOT_FOUND_BY_SUB]: {
    'pt-BR': 'Usuário não encontrado no sistema de autenticação.',
    en: 'User not found in the authentication system.',
    es: 'Usuario no encontrado en el sistema de autenticación.',
  },
  [EErrorCode.COGNITO_USER_NOT_FOUND_BY_EMAIL]: {
    'pt-BR': 'Usuário não encontrado no sistema de autenticação.',
    en: 'User not found in the authentication system.',
    es: 'Usuario no encontrado en el sistema de autenticación.',
  },
  [EErrorCode.COGNITO_USER_ALREADY_CONFIRMED]: {
    'pt-BR': 'Não é possível atualizar o telefone de um usuário já confirmado.',
    en: 'Cannot update the phone number of an already confirmed user.',
    es: 'No se puede actualizar el número de teléfono de un usuario ya confirmado.',
  },
  [EErrorCode.FIELD_MIN_LENGTH]: {
    'pt-BR': 'O campo não atinge o tamanho mínimo exigido.',
    en: 'The field does not meet the minimum required length.',
    es: 'El campo no cumple con la longitud mínima requerida.',
  },
  [EErrorCode.FIELD_MAX_LENGTH]: {
    'pt-BR': 'O campo excede o tamanho máximo permitido.',
    en: 'The field exceeds the maximum allowed length.',
    es: 'El campo excede la longitud máxima permitida.',
  },
  [EErrorCode.FIELD_INVALID]: {
    'pt-BR': 'O valor informado no campo é inválido.',
    en: 'The value provided in the field is invalid.',
    es: 'El valor proporcionado en el campo no es válido.',
  },
  [EErrorCode.FIELD_MIN_VALUE]: {
    'pt-BR': 'O valor informado é menor que o mínimo permitido.',
    en: 'The value provided is less than the minimum allowed.',
    es: 'El valor proporcionado es menor que el mínimo permitido.',
  },
  [EErrorCode.FIELD_MAX_VALUE]: {
    'pt-BR': 'O valor informado é maior que o máximo permitido.',
    en: 'The value provided is greater than the maximum allowed.',
    es: 'El valor proporcionado es mayor que el máximo permitido.',
  },
  [EErrorCode.SERVICE_DEPENDENT_INACTIVE]: {
    'pt-BR':
      'Dependente inativo. Por favor, ative o dependente para continuar.',
    en: 'Inactive dependent. Please activate the dependent to continue.',
    es: 'Dependente inactivo. Por favor, active el dependente para continuar.',
  },
  [EErrorCode.COGNITO_USER_CONFIRM_FAILED]: {
    'pt-BR': 'Falha ao confirmar o usuário. Por favor, tente novamente.',
    en: 'Failed to confirm user. Please try again.',
    es: 'Error al confirmar el usuario. Por favor, inténtelo de nuevo.',
  },
};
