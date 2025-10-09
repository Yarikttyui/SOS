plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.bashbosh.rescue"
    compileSdk = 35

    val apiBaseUrl = (project.findProperty("API_BASE_URL") as String?) ?: "https://api.bashbosh.ru"
    val wsBaseUrl = (project.findProperty("WS_BASE_URL") as String?) ?: "wss://api.bashbosh.ru"
    val versionNameProp = (project.findProperty("VERSION_NAME") as String?) ?: "2.0.0-alpha01"
    val versionCodeProp = (project.findProperty("VERSION_CODE") as String?)?.toIntOrNull() ?: 20001

    defaultConfig {
        applicationId = "com.bashbosh.rescue"
        minSdk = 24
        targetSdk = 35
        versionCode = versionCodeProp
        versionName = versionNameProp

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        buildConfigField("String", "WS_BASE_URL", "\"$wsBaseUrl\"")
    }

    signingConfigs {
        create("release") {
            val storeFilePath = project.findProperty("RELEASE_STORE_FILE") as String?
            if (!storeFilePath.isNullOrBlank()) {
                storeFile = file(storeFilePath)
                storePassword = project.findProperty("RELEASE_STORE_PASSWORD") as String?
                keyAlias = project.findProperty("RELEASE_KEY_ALIAS") as String?
                keyPassword = project.findProperty("RELEASE_KEY_PASSWORD") as String?
            }
        }
    }

    buildTypes {
        debug {
            enableUnitTestCoverage = true
            enableAndroidTestCoverage = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    sourceSets {
        getByName("main").java.setSrcDirs(listOf("src/main/kotlin"))
        getByName("test").java.setSrcDirs(listOf("src/test/kotlin"))
        getByName("androidTest").java.setSrcDirs(listOf("src/androidTest/kotlin"))
    }
}

dependencies {
    implementation(project(":core:common"))
    implementation(project(":core:designsystem"))
    implementation(project(":domain"))
    implementation(project(":data:network"))
    implementation(project(":data:local"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation("com.google.android.material:material:1.12.0")
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.material.icons)
    implementation(libs.androidx.hilt.navigation.compose)

    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.androidx.datastore.preferences)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)

    implementation(libs.timber)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}