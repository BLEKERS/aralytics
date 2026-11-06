package ph.aralytics.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aralyticsOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Aralytics API")
                        .version("0.40.0")
                        .description("40% milestone: fixed system access, quiz engine, diagnostic feedback, "
                                + "student dashboard, and teacher roster. Swagger UI is enabled in the dev profile only.")
                        .contact(new Contact().name("Aralytics")))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
