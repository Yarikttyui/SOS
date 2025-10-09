plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.bashbosh.rescue.data.local"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
        consumerProguardFiles("consumer-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(project(":core:common"))

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.sqlDelight.runtime)
    implementation(libs.sqlDelight.coroutines)
    implementation(libs.sqlDelight.android.driver)
}
